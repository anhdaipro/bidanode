import { Router } from 'express';
import TableSessionController from '../controllers/TableSessionController';
import { authenticateJWT } from '../middleware';

const router = Router();
router.use(authenticateJWT)
router.post('/create', TableSessionController.createTableSession);
router.post('/start', TableSessionController.startTableSession);
router.get('', TableSessionController.getAllTableSessions);
router.get('/view/:id', TableSessionController.getTableSessionById);
router.post('/update/:id', TableSessionController.updateTableSession);
router.post('/delete/:id', TableSessionController.deleteTableSession);
router.post('/finish/:id', TableSessionController.finishTableSession);
router.post('/order/:id', TableSessionController.orderProductTableSession);
router.post('/reward/:id', TableSessionController.createRewardTableSession);
export default router;