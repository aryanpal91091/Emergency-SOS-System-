import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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

// Serve frontend static build if available (Unified Full-Stack Deployment)
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexHtml = path.join(frontendDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>ResQRoute Emergency Engine</title></head>
          <body style="background:#030712;color:#f3f4f6;font-family:sans-serif;padding:2rem;text-align:center;">
            <h1 style="color:#ef4444;">🚨 ResQRoute Emergency Engine Backend Active</h1>
            <p>API service is operational.</p>
            <p><a href="/api/health" style="color:#60a5fa;">Check /api/health</a></p>
          </body>
        </html>
      `);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚨 ResQRoute Emergency Server running on port ${PORT}`);
  console.log(`📡 Socket.IO Realtime Engine initialized`);
  console.log(`=======================================================`);
});
