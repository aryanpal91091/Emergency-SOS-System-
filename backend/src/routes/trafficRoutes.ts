import { Router } from 'express';
import { getAllTrafficSignals, updateSignalStatus } from '../controllers/trafficController';

const router = Router();

router.get('/signals', getAllTrafficSignals);
router.patch('/signals/:id', updateSignalStatus);

export default router;
