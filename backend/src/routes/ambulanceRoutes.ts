import { Router } from 'express';
import { getAllAmbulances, updateAmbulanceLocation } from '../controllers/ambulanceController';

const router = Router();

router.get('/', getAllAmbulances);
router.patch('/:id/location', updateAmbulanceLocation);

export default router;
