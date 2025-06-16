import { Router } from 'express';
import ProductTransactionController from '../controllers/ProductTransactionController';
import { authenticateJWT } from '../middleware';

const router = Router();
router.use(authenticateJWT);
router.post('/create',
     ProductTransactionController.createProductTransaction);
router.get('', ProductTransactionController.getAllProductTransactions);
router.get('/view/:id', ProductTransactionController.getProductTransactionById);
router.post('/update/:id', ProductTransactionController.updateProductTransaction);
router.post('/delete/:id', ProductTransactionController.deleteProductTransaction);

export default router;