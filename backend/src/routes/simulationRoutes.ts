import { Router } from 'express';
import { triggerDemoAccident, resetSimulation } from '../controllers/simulationController';

const router = Router();

router.post('/trigger-accident', triggerDemoAccident);
router.post('/reset', resetSimulation);

export default router;
