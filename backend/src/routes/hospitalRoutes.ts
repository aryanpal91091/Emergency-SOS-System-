import { Router } from 'express';
import { getAllHospitals, updateHospitalAlertStatus } from '../controllers/hospitalController';

const router = Router();

router.get('/', getAllHospitals);
router.patch('/alerts/:alertId', updateHospitalAlertStatus);

export default router;
