import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '../prisma/client';

export function setupEmergencySocket(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join role or emergency specific rooms
    socket.on('join', (data: { room: string; role?: string; userId?: string }) => {
      const { room, role } = data;
      if (room) {
        socket.join(room);
        console.log(`[Socket.IO] ${socket.id} joined room: ${room}`);
      }
      if (role) {
        socket.join(`role:${role}`);
        console.log(`[Socket.IO] ${socket.id} joined role room: role:${role}`);
      }
    });

    // Driver location update event
    socket.on(
      'driver:location_update',
      async (data: {
        ambulanceId: string;
        emergencyId?: string;
        latitude: number;
        longitude: number;
      }) => {
        try {
          const { ambulanceId, emergencyId, latitude, longitude } = data;

          // Update Ambulance position in Database
          await prisma.ambulance.update({
            where: { id: ambulanceId },
            data: { latitude, longitude },
          });

          // Broadcast to everyone monitoring this emergency & driver role
          const payload = { ambulanceId, emergencyId, latitude, longitude, timestamp: new Date() };

          io.to(`role:POLICE`).emit('live:ambulance_position', payload);
          io.to(`role:HOSPITAL`).emit('live:ambulance_position', payload);
          io.to(`role:ADMIN`).emit('live:ambulance_position', payload);

          if (emergencyId) {
            io.to(`emergency:${emergencyId}`).emit('live:ambulance_position', payload);
          }
        } catch (error) {
          console.error('[Socket.IO] Error updating driver location:', error);
        }
      }
    );

    // Traffic signal green corridor status toggle
    socket.on(
      'traffic:signal_toggle',
      async (data: { signalId: string; status: 'NORMAL' | 'PREPARE' | 'GREEN_CORRIDOR'; emergencyId?: string }) => {
        try {
          const { signalId, status, emergencyId } = data;
          const updatedSignal = await prisma.trafficSignal.update({
            where: { id: signalId },
            data: { status },
          });

          io.emit('traffic:signal_updated', { signal: updatedSignal, emergencyId });
        } catch (error) {
          console.error('[Socket.IO] Error toggling traffic signal:', error);
        }
      }
    );

    // Hospital readiness status update
    socket.on(
      'hospital:status_update',
      async (data: { alertId: string; emergencyId: string; status: 'PENDING' | 'PREPARING' | 'READY' | 'PATIENT_ARRIVED' }) => {
        try {
          const { alertId, emergencyId, status } = data;
          const updatedAlert = await prisma.hospitalAlert.update({
            where: { id: alertId },
            data: { status },
          });

          io.emit('hospital:alert_updated', { alert: updatedAlert, emergencyId });
          if (emergencyId) {
            io.to(`emergency:${emergencyId}`).emit('hospital:alert_updated', { alert: updatedAlert });
          }
        } catch (error) {
          console.error('[Socket.IO] Error updating hospital status:', error);
        }
      }
    );

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
}
