import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import emergencyRoutes from './routes/emergencyRoutes';
import ambulanceRoutes from './routes/ambulanceRoutes';
import hospitalRoutes from './routes/hospitalRoutes';
import trafficRoutes from './routes/trafficRoutes';
import simulationRoutes from './routes/simulationRoutes';
import { setupEmergencySocket } from './sockets/emergencySocket';
import { setSocketIOInstance } from './controllers/emergencyController';
import { setSimulationSocketIO } from './controllers/simulationController';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Wire Socket.IO instance to controllers
setSocketIOInstance(io);
setSimulationSocketIO(io);
setupEmergencySocket(io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/simulation', simulationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'ResQRoute Emergency Engine',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚨 ResQRoute Emergency Server running on port ${PORT}`);
  console.log(`📡 Socket.IO Realtime Engine initialized`);
  console.log(`=======================================================`);
});
