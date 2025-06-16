import { Router } from 'express';
import PaymentController from '../controllers/PaymentController';
import { authenticateJWT } from '../middleware';

const router = Router();
router.use(authenticateJWT);
router.post('/create', PaymentController.createPayment);
router.get('', PaymentController.getAllPayments);
router.get('/view/:id', PaymentController.getPaymentById);
router.post('/update/:id', PaymentController.updatePayment);
router.post('/delete/:id', PaymentController.deletePayment);
router.get('/method/:method', PaymentController.getPaymentsByMethod);
router.post('/create-qr', PaymentController.createQrCode)

export default router;