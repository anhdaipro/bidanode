import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload,TokenExpiredError } from 'jsonwebtoken';
import User from './models/User';
import redisClient from './redisClient';
declare global {
    namespace Express {
      interface Request {
        user?: User;
      }
    }
  }
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
  
export const  authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Token không được cung cấp' });
    return;
  }
  try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        const savedToken = await redisClient.get(`user:${decoded.id}`);
        if (savedToken != token) {
          res.status(401).json({ message: 'Token không hợp lệ khác với token đã lưu' });
          return;
        }
        const user = await User.findByPk(decoded.id)
        if (!user) {
            throw new Error()
        }
        req.user = user
        next()
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({ message: 'Token đã hết hạn' });
    }
    res.status(403).json({ message: 'Token không hợp lệ' });
  }
};
