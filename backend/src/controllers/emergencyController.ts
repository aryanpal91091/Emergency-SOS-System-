import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { rankAndSelectBestAmbulance } from '../services/ai/ambulanceSelection';
import { predictEmergencyETA, calculateDistanceKm } from '../services/ai/etaPredictor';
import { generateCorridorPlan } from '../services/ai/greenCorridorPlanner';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setSocketIOInstance(io: SocketIOServer) {
  ioInstance = io;
}

export async function triggerSOS(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      latitude,
      longitude,
      address = 'Detected Emergency Location',
      emergencyType = 'ACCIDENT',
      priority = 'CRITICAL',
      patientName = req.user?.name || 'Sarah Connor',
      patientPhone = '+1 (555) 019-2834',
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
    }

    // Resolve valid citizen user record in DB to prevent foreign key violation
    let citizenId = req.user?.id;
    if (!citizenId) {
      const existingUser = await prisma.user.findFirst({ where: { role: 'CITIZEN' } });
      if (existingUser) {
        citizenId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            name: patientName,
            email: `guest_${Date.now()}@resqroute.org`,
            phone: patientPhone,
            password: 'guestpassword123',
            role: 'CITIZEN',
          },
        });
        citizenId = newUser.id;
      }
    }

    // 1. Create Emergency record in Database
    const emergency = await prisma.emergency.create({
      data: {
        citizenId,
        patientName,
        patientPhone,
        emergencyType,
        priority,
        status: 'SOS_TRIGGERED',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
      },
    });

    // Create initial status history entry
    await prisma.emergencyStatusHistory.create({
      data: {
        emergencyId: emergency.id,
        status: 'SOS_TRIGGERED',
        updatedBy: req.user?.name || 'Citizen SOS System',
      },
    });

    // 2. Fetch available ambulances
    const availableAmbulances = await prisma.ambulance.findMany({
      where: { status: 'AVAILABLE' },
    });

    // 3. AI Smart Ambulance Selection
    const { bestMatch, rankedList } = rankAndSelectBestAmbulance({
      emergencyLat: parseFloat(latitude),
      emergencyLng: parseFloat(longitude),
      emergencyType,
      priority: priority as 'CRITICAL' | 'HIGH' | 'MEDIUM',
      availableAmbulances: availableAmbulances as any[],
    });

    let assignedAmbulance = bestMatch ? bestMatch.ambulance : null;

    // Fallback: If no AVAILABLE ambulance found in DB, auto-assign or create demo available ambulance
    if (!assignedAmbulance) {
      const anyAmbulance = await prisma.ambulance.findFirst();
      if (anyAmbulance) {
        assignedAmbulance = anyAmbulance;
      }
    }

    // 4. Select nearest hospital with available beds
    const hospitals = await prisma.hospital.findMany();
    let selectedHospital: any = hospitals[0] || null;
    let minHospDist = Infinity;

    hospitals.forEach((h: any) => {
      const dist = calculateDistanceKm(
        parseFloat(latitude),
        parseFloat(longitude),
        h.latitude,
        h.longitude
      );
      if (dist < minHospDist && h.availableBeds > 0) {
        minHospDist = dist;
        selectedHospital = h;
      }
    });

    // 5. Predict Emergency ETA using AI Predictor
    const etaResult = predictEmergencyETA({
      originLat: assignedAmbulance ? assignedAmbulance.latitude : parseFloat(latitude) + 0.02,
      originLng: assignedAmbulance ? assignedAmbulance.longitude : parseFloat(longitude) + 0.02,
      destLat: parseFloat(latitude),
      destLng: parseFloat(longitude),
      emergencyPriority: priority as any,
      trafficFactor: 1.3,
      isGreenCorridorActive: true,
    });

    // 6. Generate Route & Green Corridor Plan
    const trafficSignals = await prisma.trafficSignal.findMany();
    const corridorPlan = generateCorridorPlan(
      assignedAmbulance ? assignedAmbulance.latitude : parseFloat(latitude) + 0.02,
      assignedAmbulance ? assignedAmbulance.longitude : parseFloat(longitude) + 0.02,
      selectedHospital ? selectedHospital.latitude : parseFloat(latitude) - 0.03,
      selectedHospital ? selectedHospital.longitude : parseFloat(longitude) - 0.03,
      trafficSignals as any[]
    );

    // Save Route & Upcoming signals
    await prisma.emergencyRoute.create({
      data: {
        emergencyId: emergency.id,
        routeGeoJson: JSON.stringify(corridorPlan.waypoints),
        totalDistanceKm: corridorPlan.totalDistanceKm,
        estimatedDurationMin: corridorPlan.estimatedDurationMin,
        upcomingSignalsJson: JSON.stringify(corridorPlan.upcomingSignals),
      },
    });

    // 7. Update Emergency with Ambulance, Hospital, and Status
    const updatedEmergency = await prisma.emergency.update({
      where: { id: emergency.id },
      data: {
        status: assignedAmbulance ? 'AMBULANCE_ASSIGNED' : 'AMBULANCE_SEARCHING',
        assignedAmbulanceId: assignedAmbulance ? assignedAmbulance.id : null,
        targetHospitalId: selectedHospital ? selectedHospital.id : null,
        etaMinutes: etaResult.estimatedMinutes,
      },
      include: {
        assignedAmbulance: { include: { driver: true } },
        targetHospital: true,
        routes: true,
        hospAlerts: true,
        trafficAlerts: true,
      },
    });

    // Update Ambulance status to RESPONDING
    if (assignedAmbulance) {
      await prisma.ambulance.update({
        where: { id: assignedAmbulance.id },
        data: { status: 'RESPONDING' },
      });
    }

    // 8. Create Hospital Alert
    let hospAlertRecord = null;
    if (selectedHospital) {
      hospAlertRecord = await prisma.hospitalAlert.create({
        data: {
          emergencyId: emergency.id,
          hospitalId: selectedHospital.id,
          status: 'PENDING',
          patientCondition: `Emergency: ${emergencyType} (${priority} priority)`,
          notes: `ETA: ${etaResult.estimatedMinutes} mins`,
        },
      });
    }

    // 9. Create Traffic Alerts for Upcoming Signals & set signal statuses to PREPARE / GREEN_CORRIDOR
    for (const sigSchedule of corridorPlan.upcomingSignals.slice(0, 3)) {
      await prisma.trafficAlert.create({
        data: {
          emergencyId: emergency.id,
          signalId: sigSchedule.signalId,
          actionRequired: 'Activate Green Corridor Priority',
          status: 'PREPARED',
        },
      });

      // Update signal status to GREEN_CORRIDOR for imminent signals
      await prisma.trafficSignal.update({
        where: { id: sigSchedule.signalId },
        data: { status: 'GREEN_CORRIDOR' },
      });
    }

    // Record status transition
    await prisma.emergencyStatusHistory.create({
      data: {
        emergencyId: emergency.id,
        status: updatedEmergency.status,
        updatedBy: 'ResQRoute Dispatch Engine',
      },
    });

    // 10. Real-Time Socket.IO Broadcast
    if (ioInstance) {
      const payload = {
        emergency: updatedEmergency,
        etaResult,
        corridorPlan,
        hospAlert: hospAlertRecord,
        aiRanking: rankedList,
      };

      ioInstance.emit('emergency:created', payload);
      ioInstance.to(`role:DRIVER`).emit('alert:new_emergency', payload);
      ioInstance.to(`role:POLICE`).emit('alert:green_corridor_active', payload);
      ioInstance.to(`role:HOSPITAL`).emit('alert:hospital_incoming', payload);
    }

    return res.status(201).json({
      success: true,
      message: 'Emergency SOS activated and response team dispatched',
      emergency: updatedEmergency,
      etaResult,
      corridorPlan,
      assignedAmbulance,
      selectedHospital,
      aiRanking: rankedList,
    });
  } catch (error) {
    console.error('Trigger SOS error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process emergency request' });
  }
}

export async function getEmergencyDetails(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const emergency = await prisma.emergency.findUnique({
      where: { id },
      include: {
        citizen: { select: { id: true, name: true, phone: true, email: true } },
        assignedAmbulance: { include: { driver: true } },
        targetHospital: true,
        routes: true,
        hospAlerts: { include: { hospital: true } },
        trafficAlerts: { include: { signal: true } },
        history: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency not found' });
    }

    return res.json({ success: true, emergency });
  } catch (error) {
    console.error('Get emergency error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateEmergencyStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status parameter required' });
    }

    const updated = await prisma.emergency.update({
      where: { id },
      data: { status },
      include: {
        assignedAmbulance: { include: { driver: true } },
        targetHospital: true,
        hospAlerts: true,
      },
    });

    // Record in history
    await prisma.emergencyStatusHistory.create({
      data: {
        emergencyId: id,
        status,
        updatedBy: req.user?.name || 'System User',
      },
    });

    // If completed or arrived, update ambulance status back to AVAILABLE
    if (status === 'EMERGENCY_COMPLETED' || status === 'PATIENT_ARRIVED') {
      if (updated.assignedAmbulanceId) {
        await prisma.ambulance.update({
          where: { id: updated.assignedAmbulanceId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    // Socket.IO Broadcast
    if (ioInstance) {
      ioInstance.emit('emergency:status_changed', { emergencyId: id, status, emergency: updated });
      ioInstance.to(`emergency:${id}`).emit('emergency:status_changed', { emergencyId: id, status });
    }

    return res.json({ success: true, emergency: updated });
  } catch (error) {
    console.error('Update emergency status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getActiveEmergencies(req: Request, res: Response) {
  try {
    const emergencies = await prisma.emergency.findMany({
      where: {
        status: {
          notIn: ['EMERGENCY_COMPLETED'],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedAmbulance: { include: { driver: true } },
        targetHospital: true,
        hospAlerts: true,
        trafficAlerts: { include: { signal: true } },
      },
    });

    return res.json({ success: true, count: emergencies.length, emergencies });
  } catch (error) {
    console.error('Get active emergencies error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
