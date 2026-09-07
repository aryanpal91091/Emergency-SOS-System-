import { Router } from 'express';
import {
  triggerSOS,
  getEmergencyDetails,
  updateEmergencyStatus,
  getActiveEmergencies,
} from '../controllers/emergencyController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/sos', triggerSOS);
router.get('/active', getActiveEmergencies);
router.get('/:id', getEmergencyDetails);
router.patch('/:id/status', updateEmergencyStatus);

export default router;
