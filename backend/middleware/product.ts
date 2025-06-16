import Product from "../models/Product";
import express, { Request, Response, NextFunction } from 'express';
export const loadModel = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const product = await Product.findByPk(id);
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        
      }
      // gắn vào req để dùng ở middleware/controller sau
      (req as any).product = product;
  
      next(); // tiếp tục middleware chain
    } catch (err) {
      res.status(500).json({ message: 'Internal server error', error: err });
    }
  };
