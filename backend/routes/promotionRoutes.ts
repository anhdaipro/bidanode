import { Router } from 'express';
import PromotionController from '../controllers/PromotionController';

const router = Router();

router.post('/promotions', PromotionController.createPromotion);
router.get('/promotions', PromotionController.getAllPromotions);
router.get('/promotions/:id', PromotionController.getPromotionById);
router.put('/promotions/:id', PromotionController.updatePromotion);
router.delete('/promotions/:id', PromotionController.deletePromotion);
router.get('/promotions/:id/remaining-hours', PromotionController.getRemainingBonusHours);

export default router;