import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export async function getAllHospitals(req: Request, res: Response) {
  try {
    const hospitals = await prisma.hospital.findMany({
      include: {
        alerts: {
          include: {
            emergency: {
              include: { assignedAmbulance: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return res.json({ success: true, count: hospitals.length, hospitals });
  } catch (error) {
    console.error('Get hospitals error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateHospitalAlertStatus(req: Request, res: Response) {
  try {
    const { alertId } = req.params;
    const { status, notes } = req.body;

    const alert = await prisma.hospitalAlert.update({
      where: { id: alertId },
      data: {
        status,
        notes: notes || undefined,
      },
      include: { emergency: true },
    });

    // If status is PATIENT_ARRIVED, update emergency status as well
    if (status === 'PATIENT_ARRIVED') {
      await prisma.emergency.update({
        where: { id: alert.emergencyId },
        data: { status: 'PATIENT_ARRIVED' },
      });
    }

    return res.json({ success: true, alert });
  } catch (error) {
    console.error('Update hospital alert error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
