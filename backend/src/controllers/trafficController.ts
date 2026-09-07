import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export async function getAllTrafficSignals(req: Request, res: Response) {
  try {
    const signals = await prisma.trafficSignal.findMany({
      include: { alerts: { include: { emergency: true } } },
    });
    return res.json({ success: true, count: signals.length, signals });
  } catch (error) {
    console.error('Get traffic signals error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateSignalStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const signal = await prisma.trafficSignal.update({
      where: { id },
      data: { status },
    });

    return res.json({ success: true, signal });
  } catch (error) {
    console.error('Update signal status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
