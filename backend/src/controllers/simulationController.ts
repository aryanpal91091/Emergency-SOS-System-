import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { rankAndSelectBestAmbulance } from '../services/ai/ambulanceSelection';
import { predictEmergencyETA, calculateDistanceKm } from '../services/ai/etaPredictor';
import { generateCorridorPlan } from '../services/ai/greenCorridorPlanner';
import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setSimulationSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

export async function resetSimulation(req: Request, res: Response) {
  try {
    // Reset traffic signals to NORMAL
    await prisma.trafficSignal.updateMany({
      data: { status: 'NORMAL' },
    });

    // Reset ambulances to AVAILABLE and reposition to default base stations
    const ambulances = await prisma.ambulance.findMany();
    if (ambulances[0]) {
      await prisma.ambulance.update({
        where: { id: ambulances[0].id },
        data: { status: 'AVAILABLE', latitude: 28.6139, longitude: 77.209 },
      });
    }
    if (ambulances[1]) {
      await prisma.ambulance.update({
        where: { id: ambulances[1].id },
        data: { status: 'AVAILABLE', latitude: 28.625, longitude: 77.218 },
      });
    }

    if (ioInstance) {
      ioInstance.emit('simulation:reset', { timestamp: new Date() });
    }

    return res.json({ success: true, message: 'Simulation reset complete' });
  } catch (error) {
    console.error('Reset simulation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset simulation' });
  }
}

export async function triggerDemoAccident(req: Request, res: Response) {
  try {
    const {
      patientName = 'Alex Mercer (Simulated)',
      emergencyType = 'ACCIDENT',
      priority = 'CRITICAL',
      latitude = 28.6175,
      longitude = 77.213,
      address = 'Connaught Place Circle, Central Avenue',
    } = req.body;

    // Fetch default citizen user or create mock
    let citizen = await prisma.user.findFirst({ where: { role: 'CITIZEN' } });
    if (!citizen) {
      citizen = await prisma.user.create({
        data: {
          name: 'Default Citizen',
          email: 'citizen@resqroute.org',
          phone: '+1-555-0192',
          password: 'password123',
          role: 'CITIZEN',
        },
      });
    }

    // 1. Create Emergency
    const emergency = await prisma.emergency.create({
      data: {
        citizenId: citizen.id,
        patientName,
        patientPhone: '+1-555-9110',
        emergencyType,
        priority,
        status: 'SOS_TRIGGERED',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
      },
    });

    // 2. Select nearest ambulance
    const availableAmbulances = await prisma.ambulance.findMany({ where: { status: 'AVAILABLE' } });
    const { bestMatch } = rankAndSelectBestAmbulance({
      emergencyLat: parseFloat(latitude),
      emergencyLng: parseFloat(longitude),
      emergencyType,
      priority: priority as any,
      availableAmbulances: availableAmbulances.length > 0 ? availableAmbulances : await prisma.ambulance.findMany(),
    });

    const assignedAmbulance = bestMatch ? bestMatch.ambulance : (await prisma.ambulance.findFirst());

    // 3. Select nearest hospital
    const hospitals = await prisma.hospital.findMany();
    const targetHospital = hospitals[0] || null;

    // 4. Update emergency record
    const updatedEmergency = await prisma.emergency.update({
      where: { id: emergency.id },
      data: {
        status: 'AMBULANCE_ASSIGNED',
        assignedAmbulanceId: assignedAmbulance ? assignedAmbulance.id : null,
        targetHospitalId: targetHospital ? targetHospital.id : null,
        etaMinutes: 6.5,
      },
      include: {
        assignedAmbulance: { include: { driver: true } },
        targetHospital: true,
      },
    });

    // Mark ambulance as RESPONDING
    if (assignedAmbulance) {
      await prisma.ambulance.update({
        where: { id: assignedAmbulance.id },
        data: { status: 'RESPONDING' },
      });
    }

    // Create hospital alert
    let hospAlert = null;
    if (targetHospital) {
      hospAlert = await prisma.hospitalAlert.create({
        data: {
          emergencyId: emergency.id,
          hospitalId: targetHospital.id,
          status: 'PREPARING',
          patientCondition: `${emergencyType} - ${priority} Level Trauma`,
          notes: 'Emergency resuscitation team dispatched to Trauma Bay 1',
        },
      });
    }

    // Set nearby signals to GREEN_CORRIDOR
    const signals = await prisma.trafficSignal.findMany();
    for (const signal of signals.slice(0, 2)) {
      await prisma.trafficSignal.update({
        where: { id: signal.id },
        data: { status: 'GREEN_CORRIDOR' },
      });
    }

    const corridorPlan = generateCorridorPlan(
      assignedAmbulance ? assignedAmbulance.latitude : parseFloat(latitude) + 0.015,
      assignedAmbulance ? assignedAmbulance.longitude : parseFloat(longitude) + 0.015,
      targetHospital ? targetHospital.latitude : parseFloat(latitude) - 0.02,
      targetHospital ? targetHospital.longitude : parseFloat(longitude) - 0.02,
      signals
    );

    const payload = {
      emergency: updatedEmergency,
      assignedAmbulance,
      targetHospital,
      hospAlert,
      corridorPlan,
    };

    if (ioInstance) {
      ioInstance.emit('simulation:accident_started', payload);
      ioInstance.to(`role:DRIVER`).emit('alert:new_emergency', payload);
      ioInstance.to(`role:POLICE`).emit('alert:green_corridor_active', payload);
      ioInstance.to(`role:HOSPITAL`).emit('alert:hospital_incoming', payload);
    }

    return res.status(201).json({
      success: true,
      message: 'Simulated accident & emergency response initiated',
      ...payload,
    });
  } catch (error) {
    console.error('Demo simulation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to start demo simulation' });
  }
}
