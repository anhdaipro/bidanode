import { Router } from 'express';
import TimeSheetController from '../controllers/TimeSheetController';
import { authenticateJWT } from '../middleware';
const router = Router();
router.use(authenticateJWT);
router.post('/checkin', TimeSheetController.checkIn);
router.post('/checkout', TimeSheetController.checkOut);
router.get('/view/:id', TimeSheetController.actionView);
router.get('/', TimeSheetController.actionIndex);
router.post('/update/:id', TimeSheetController.actionUpdate);
export default router;