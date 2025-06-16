import { Request, Response } from 'express';
import Product from '../models/Product';
import fs from 'fs';
import path from 'path'
import { Op,ValidationError, ValidationErrorItem} from 'sequelize';
import { addDay, convertDate } from '../Format';
import User from '../models/User';
import redisClient from '../redisClient';
import { ChangeLog } from '@type/Model';
import LogUpdate, { TYPE_PRODUCT } from '../models/LogUpdate';
import { PageTitlesMap } from '@type/controller';
// import { folder } from '../routes/productRoutes';
class ProductController {
  static pageTitles: PageTitlesMap = {
    createProduct: 'Tạo sản phẩm',
    updateProduct: 'Cập nhật sản phẩm',
    getAllProducts: 'Danh sách sản phẩm',
    getAllProductsSearch: 'Danh sách sản phẩm',
    getProductById: 'Thông tin sản phẩm',
    deleteProduct: 'Xóa sản phẩm',
    setStatus:'Cập nhật trạng thái'
  }
  // Tạo một sản phẩm mới
  public static async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const { name, price, categoryId,status,image,public_image} = req.body;
      // const image = req.file ? req.file.path : null;
      const uidLogin = req.user?.id;
      if(!uidLogin){
        res.status(400).json({ message: 'Không thể lấy ID người dùng' });
        return;
      }
      const product = new Product({
        name,
        price,
        categoryId,
        status,
        ...(public_image &&{ public_image }),
        ...(image && { image }),
        uidLogin,
      });
      
      product.validateCreate();
      await product.save();
      // Xóa cache liên quan
      await product.deleteCache()
      res.status(201).json({
        message: 'Product created successfully',
        data: product,
      });
    } catch (error ) {
      if(error instanceof ValidationError){
        res.status(400).json({
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path,
            message: err.message,
          })),
        });
      }else{
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ message: 'Unexpected error', error: errorMessage });
      }
    }
  }

  // Lấy danh sách tất cả sản phẩm
  public static async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      // Lấy các tham số từ query
      const { page = 1, limit = 20, name, status, dateFrom, dateTo,categoryId } = req.query;
      const user = req.user as User;
      if (!user) {
        res.status(400).json({ message: 'Không thể lấy ID người dùng' });
        return;
      }
      // Chuyển đổi `page` và `limit` sang số nguyên
      const pageNumber = parseInt(page as string, 10) || 1;
      const limitNumber = parseInt(limit as string, 10) || 20;
      // Tính toán offset
      const offset = (pageNumber - 1) * limitNumber;
      const cacheKey = `products:${pageNumber}:${limitNumber}:${name || ''}:${categoryId || ''}:${status || ''}:${dateFrom || ''}:${dateTo || ''}`;

      //Kiểm tra cache
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        res.status(200).json({
          message: 'Products retrieved successfully (from cache)',
          ...parsedData
        });
        return;
      }
      // Tạo điều kiện tìm kiếm
      const where:any = {};
      if (name) {
        where.name = { [Op.like]: `%${name}%` }; // Tìm kiếm theo tên (LIKE '%name%')
      }
      if (status) {
        where.status = status; // Tìm kiếm theo trạng thái
      }
      if (categoryId) {
        where.categoryId = categoryId; // Tìm kiếm theo trạng thái
      }
      if (dateFrom || dateTo) {
        where.createdAt = {
          ...(dateFrom && { [Op.gte]: dateFrom }), // Ngày bắt đầu
          ...(dateTo && { [Op.lte]: addDay(dateTo as string,1)  }), // Ngày kết thúc
        };
      }
      // Truy vấn cơ sở dữ liệu với phân trang và điều kiện tìm kiếm
      const { rows: products, count: total } = await Product.findAndCountAll({
        where,
        limit: limitNumber,
        offset,
        include: [{model:User, as:'rUidLogin', attributes:['name']}],
        distinct:true,
        order:[['id', 'DESC']]
      });
      const aProduct = products.map((product:Product) => {
        product.fnCanDelete(user)
        product.fnCanUpdate(user)
        product.fnCanUpdateStatus(user)
        return {...product.toJSON(),
          canDelete: product.canDelete,
          canUpdate: product.canUpdate,
        };
      })
      // Tính tổng số trang
      const totalPages = Math.ceil(total / limitNumber);
      const data = {
        data: aProduct,
        pagination: {
          total: total,
          totalPages: totalPages,
          currentPage: pageNumber,
          limit: limitNumber,
        },
      }
      // Lưu kết quả vào cache
      await redisClient.set(cacheKey, JSON.stringify(data), 'EX', 3600); // Cache trong 1 giờ
      // Trả về kết quả
      res.status(200).json({
        message: 'Products retrieved successfully',
        ...data
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving products',
        error: errorMessage,
      });
    }
  }
//
  public static async getAllProductsSearch(req: Request, res: Response): Promise<void> {
    const mProduct = new Product();
    const products = await mProduct.getAllProduct();
    res.status(200).json(products)
  }
  // Lấy thông tin một sản phẩm theo ID
  public static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const product = (req as any).product;
      if (!product) {
        res.status(404).json({
          message: 'Không tìm thấy sản phẩm',
        });
        return;
      }

      res.status(200).json({
        message: 'Product retrieved successfully',
        data: product,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving product',
        error: errorMessage,
      });
    }
  }

  // Cập nhật thông tin một sản phẩm
  public static async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { name, price, categoryId, status,image,public_image } = req.body;
      const product = (req as any).product;
      product.modelOld = {...product.toJSON()};
      if (!product) {
        res.status(404).json({
          message: 'Không tìm thấy sản phẩm',
        });
        return;
      }
      // 2. So sánh thay đổi
      const updates = req.body;
      const changes:ChangeLog = {};
      for (const key in updates) {
        if (product[key] != updates[key]) {
          changes[key] = {
            old: product[key],
            new: updates[key],
          };
        }
      }
      Object.assign(product, { name, price, categoryId, status });
      if(image){
        product.image = image
        product.public_image = public_image;
        product.deleteImage()
      }
      await product.save();
      const uidLogin = req.user?.id;
      if (Object.keys(changes).length > 0) {
        await LogUpdate.create({
          userId: uidLogin,
          belongId:product.id,
          type:TYPE_PRODUCT,
          roleId: req.user?.roleId,
          changes,
        });
      }
      // Xóa cache liên quan
      await product.deleteCache()
      res.status(200).json({
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error updating product',
        error: errorMessage,
      });
    }
  }

  // Xóa một sản phẩm
  public static async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const product = (req as any).product;
      if (!product) {
        return;
      }
      await product.destroy();
      // Xóa cache liên quan
      await product.deleteCache()
      res.status(200).json({
        message: 'Product deleted successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error deleting product',
        error: errorMessage,
      });
    }
  }
  public static async setStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      const product = (req as any).product;
      // const product = await this.loadModel(req, res);
      if (!product) {
        return;
      }
      // console.log(product)
      await product.update({
        status
      });
      
      // Xóa cache liên quan
      // const product = new Product()
      await product.deleteCache()
      res.status(200).json({
        message: 'Update thành công',
        data:product
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving product',
        error: errorMessage,
      });
    }

  }
  public static async createMutiple(req: Request, res: Response): Promise<void> {
    try {
      const { products } = req.body;


      if (products.length == 0) {
        res.status(404).json({
          message: 'Product not found',
        });
        return;
      }
      await Product.bulkCreate(products)
      // Xóa cache liên quan
      const product = new Product()
      await product.deleteCache()
      res.status(200).json({
        message: 'Tạo mới thành công',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving product',
        error: errorMessage,
      });
    }

  }
}

export default ProductController;