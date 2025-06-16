// src/types/express.d.ts
import Product from "@/backend/models/Product";
import { User } from "../models/User";

// Đảm bảo đây là module bằng cách thêm export {} nếu không có import
export {}; // Dòng này biến file thành module

declare global {
  namespace Express {
    interface Request {
      user?: User;
      controllerName?: string;
      actionName?: string;
      product?:Product
    }
  }
}