import { Router } from 'express';
import BilliardTableController from '../controllers/BilliardTableController';
import { authenticateJWT } from '../middleware';

const router = Router();
router.use(authenticateJWT);
router.get('/', BilliardTableController.getAll);
router.get('/view/:id', BilliardTableController.getById);
router.post('/create', BilliardTableController.create);
router.post('/update/:id', BilliardTableController.update);
router.post('/delete/:id', BilliardTableController.delete);
router.get('/active', BilliardTableController.getActiveTables);

export default router;