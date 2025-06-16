import { Request, Response } from 'express';
import Promotion from '../models/Reward';

class PromotionController {
  // Tạo một bản ghi mới
  public static async createPromotion(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, totalBonusHours, usedBonusHours } = req.body;

      const promotion = await Promotion.create({
        phoneNumber,
        totalBonusHours,
        usedBonusHours,
      });

      res.status(201).json({
        message: 'Promotion created successfully',
        data: promotion,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error creating promotion',
        error: errorMessage,
      });
    }
  }

  // Lấy danh sách tất cả các bản ghi
  public static async getAllPromotions(req: Request, res: Response): Promise<void> {
    try {
      const promotions = await Promotion.findAll();
      res.status(200).json({
        message: 'Promotions retrieved successfully',
        data: promotions,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving promotions',
        error: errorMessage,
      });
    }
  }

  // Lấy một bản ghi theo ID
  public static async getPromotionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const promotion = await Promotion.findByPk(id);

      if (!promotion) {
        res.status(404).json({
          message: 'Promotion not found',
        });
      }

      res.status(200).json({
        message: 'Promotion retrieved successfully',
        data: promotion,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving promotion',
        error: errorMessage,
      });
    }
  }

  // Cập nhật một bản ghi
  public static async updatePromotion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { phoneNumber, totalBonusHours, usedBonusHours } = req.body;

      const promotion = await Promotion.findByPk(id);

      if (!promotion) {
         res.status(404).json({
          message: 'Promotion not found',
        });
        return;
      }

      await promotion.update({
        phoneNumber,
        totalBonusHours,
        usedBonusHours,
      });

       res.status(200).json({
        message: 'Promotion updated successfully',
        data: promotion,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error updating promotion',
        error: errorMessage,
      });
    }
  }

  // Xóa một bản ghi
  public static async deletePromotion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const promotion = await Promotion.findByPk(id);

      if (!promotion) {
        res.status(404).json({
          message: 'Promotion not found',
        });
        return;
      }

      await promotion.destroy();

      res.status(200).json({
        message: 'Promotion deleted successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error deleting promotion',
        error: errorMessage,
      });
    }
  }

  // Lấy số giờ khuyến mãi còn lại
  public static async getRemainingBonusHours(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const promotion = await Promotion.findByPk(id);

      if (!promotion) {
        res.status(404).json({
          message: 'Promotion not found',
        });
        return;
      }

      const remainingHours = promotion.remainingBonusHours();

      res.status(200).json({
        message: 'Remaining bonus hours retrieved successfully',
        data: { remainingBonusHours: remainingHours },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving remaining bonus hours',
        error: errorMessage,
      });
    }
  }
}

export default PromotionController;