import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export async function getAllAmbulances(req: Request, res: Response) {
  try {
    const ambulances = await prisma.ambulance.findMany({
      include: { driver: true, emergencies: { where: { status: { notIn: ['EMERGENCY_COMPLETED'] } } } },
    });
    return res.json({ success: true, count: ambulances.length, ambulances });
  } catch (error) {
    console.error('Get ambulances error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateAmbulanceLocation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { latitude, longitude, status } = req.body;

    const data: any = {};
    if (latitude !== undefined) data.latitude = parseFloat(latitude);
    if (longitude !== undefined) data.longitude = parseFloat(longitude);
    if (status) data.status = status;

    const updated = await prisma.ambulance.update({
      where: { id },
      data,
    });

    return res.json({ success: true, ambulance: updated });
  } catch (error) {
    console.error('Update ambulance error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
