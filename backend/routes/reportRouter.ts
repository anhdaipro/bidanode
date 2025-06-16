import { Router } from 'express';
import ReportController from '../controllers/ReportControllers';
import { authenticateJWT } from '../middleware';

const router = Router();
router.use(authenticateJWT);
router.get('/anh', ReportController.bestSellingProduct)
router.get('/export', ReportController.reportExport)
router.get('/inventory', ReportController.inventory)
router.get('/revenue/week', ReportController.getRevenueSummaryLast7Days)
export default router;