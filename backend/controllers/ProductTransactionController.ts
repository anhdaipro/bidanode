import { Request, Response } from 'express';
import ProductTransaction from '../models/ProductTransaction';
import ProductTransactionDetail from '../models/ProductTransactionDetail';
import { addDay, convertDate, convertDateFormat } from '../Format';
import { Op } from 'sequelize';
import User from '../models/User';
import { ChangeLog } from '@type/Model';
import LogUpdate, { TYPE_TRANSACTION } from '../models/LogUpdate';
import { PageTitlesMap } from '@type/controller';
import dayjs from 'dayjs';
class ProductTransactionController {
  // Tạo một ProductTransaction và các ProductTransactionDetail liên quan
  static pageTitles: PageTitlesMap = {
    createProductTransaction: 'Tạo giao dịch sản phẩm',
    updateProductTransaction: 'Cập nhật giao dịch sản phẩm',
    getAllProductTransactions: 'Danh sách giao dịch',
    getProductTransactionById:'Thông tin giao dịch',
    deleteProductTransaction:'Xóa giao dịch',

    // ... các action khác
  };
  public static async createProductTransaction(req: Request, res: Response): Promise<void> {
    const transaction = await ProductTransaction.sequelize?.transaction(); // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
    try {
      const { type, totalAmount, dateDelivery, details } = req.body;
      const uidLogin = req.user?.id
      if (!uidLogin) {
        res.status(400).json({ message: 'Không thể lấy ID người dùng' });
        return;
      }
      if(details.length == 0) {
        res.status(400).json({ message: 'Vui lòng nhập ít nhất 1 dòng chi tiết' });
        return;
      }
      // Tạo ProductTransaction
      const date = dayjs(dateDelivery);
      const dateDeliveryBigint = date.unix();
      const productTransaction = new ProductTransaction();
      Object.assign(productTransaction, {
        type,
        totalAmount,
        dateDelivery: date,
        dateDeliveryBigint,
        uidLogin,
      });

      await productTransaction.save();
      //Tạo các ProductTransactionDetail liên quan
      const productTransactionDetails = details.map(({categoryId,productId, quantity, price}: ProductTransactionDetail) => ({
        transactionId: productTransaction.id,
        productId,
        type,
        categoryId, 
        quantity,
        price,
        totalPrice: quantity * price,
        dateDelivery:date,
        dateDeliveryBigint,
        uidLogin,
      }));
      await ProductTransactionDetail.bulkCreate(productTransactionDetails, { transaction });

      // Commit transaction
      await transaction?.commit();

      res.status(201).json({
        message: 'ProductTransaction and ProductTransactionDetails created successfully',
        data: {
          productTransaction,
          
        },
      });
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await transaction?.rollback();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error creating ProductTransaction',
        error: errorMessage,
      });
    }
  }

  // Lấy danh sách tất cả ProductTransaction
  public static async getAllProductTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, codeNo, dateFrom, dateTo,type } = req.query;
      // Chuyển đổi `page` và `limit` sang số nguyên
      const pageNumber = parseInt(page as string, 10) || 1;
      const limitNumber = parseInt(limit as string, 10) || 20;
      // Tính toán offset
      const offset = (pageNumber - 1) * limitNumber;
  
      // Tạo điều kiện tìm kiếm
      const where:any = {};
      if (codeNo) {
        where.codeNo = codeNo; // Tìm kiếm theo tên (LIKE '%name%')
      }
      if (type) {
        where.type = type; // Tìm kiếm theo trạng thái
      }
      if (dateFrom || dateTo) {
        where.createdAt = {
          ...(dateFrom && { [Op.gte]: dateFrom }), // Ngày bắt đầu
          ...(dateTo && { [Op.lte]: addDay(dateTo as string,1)  }), // Ngày kết thúc
        };
      }
      // Truy vấn cơ sở dữ liệu với phân trang và điều kiện tìm kiếm
      const { rows: productTransactions, count: total } = await ProductTransaction.findAndCountAll({
        where,
        limit: limitNumber,
        offset,
        include: [
          { model: ProductTransactionDetail, as: 'details'},
          { model: User, as: 'rUidLogin', attributes:['name']}
        ],
        distinct: true,
        order:[['id', 'DESC']]
      });
      // Tính tổng số trang
      const totalPages = Math.ceil(total / limitNumber);
      const result = await Promise.all(productTransactions.map(async (transaction:any) => {
        return {...transaction.toJSON(),codeSession: await transaction.getCodeNoSession()};
      }));
      
      res.status(200).json({
        message: 'ProductTransactions retrieved successfully',
        data: result,
        pagination: {
          total,
          totalPages,
          currentPage: pageNumber,
          limit: limitNumber,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving ProductTransactions',
        error: errorMessage,
      });
    }
  }

  // Lấy thông tin một ProductTransaction theo ID
  public static async getProductTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const productTransaction = await ProductTransaction.findByPk(id, {
        // raw: true, // Thêm dòng này
        include: [{ model: ProductTransactionDetail, as: 'details' }],
      });

      if (!productTransaction) {
        res.status(404).json({
          message: 'ProductTransaction not found',
        });
        return;
      }

      res.status(200).json({
        message: 'ProductTransaction retrieved successfully',
        data: productTransaction,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving ProductTransaction',
        error: errorMessage,
      });
    }
  }

  // Cập nhật một ProductTransaction và các ProductTransactionDetail liên quan
  public static async updateProductTransaction(req: Request, res: Response): Promise<void> {
    const transaction = await ProductTransaction.sequelize?.transaction();
    try {
      const { id } = req.params;
      const { type, dateDelivery, totalAmount, details } = req.body;
      const uidLogin = req.user?.id
      if (!uidLogin) {
        res.status(400).json({ message: 'Không thể lấy ID người dùng' });
        return;
      }
      const productTransaction = await ProductTransaction.findByPk(id);

      if (!productTransaction) {
        res.status(404).json({
          message: 'ProductTransaction not found',
        });
        return;
      }
      // 2. So sánh thay đổi
      const updates:any = { type, dateDelivery, totalAmount };
      const changes:ChangeLog = {};
      for (const key in updates) {
        const oldValue = (productTransaction as any)[key];
        if (oldValue != updates[key]) {
          changes[key] = {
            old: oldValue,
            new: updates[key],
          };
        }
      }
      const date = dayjs(dateDelivery);
      const dateDeliveryBigint = date.unix();
      Object.assign(productTransaction,{type,totalAmount,dateDelivery: date,dateDeliveryBigint})
      // Cập nhật ProductTransaction
      await productTransaction.save()
      if (Object.keys(changes).length > 0) {
        await LogUpdate.create({
          userId: uidLogin,
          belongId:id,
          type:TYPE_TRANSACTION,
          roleId: req.user?.roleId,
          changes,
        });
      }
      // Xóa các ProductTransactionDetail cũ
      await ProductTransactionDetail.destroy({
        where: { transactionId: id },
        transaction,
      });

      //Tạo các ProductTransactionDetail mới
      const transactionId = productTransaction.id;
      const productTransactionDetails = details.map(({productId,price,quantity}: ProductTransactionDetail) => ({
        transactionId,
        productId,
        quantity,
        price,
        totalPrice: quantity * price,
        type,
        dateDelivery:date,
        dateDeliveryBigint,
        uidLogin,
      }));

      await ProductTransactionDetail.bulkCreate(productTransactionDetails, { transaction });

      // Commit transaction
      await transaction?.commit();

      res.status(200).json({
        message: 'ProductTransaction and ProductTransactionDetails updated successfully',
        data: {
          productTransaction,
          // productTransactionDetails,
        },
      });
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await transaction?.rollback();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error updating ProductTransaction',
        error: errorMessage,
      });
    }
  }

  // Xóa một ProductTransaction và các ProductTransactionDetail liên quan
  public static async deleteProductTransaction(req: Request, res: Response): Promise<void> {
    const transaction = await ProductTransaction.sequelize?.transaction();
    try {
      const { id } = req.params;

      const productTransaction = await ProductTransaction.findByPk(id);

      if (!productTransaction) {
        res.status(404).json({
          message: 'ProductTransaction not found',
        });
        return;
      }
      // Xóa ProductTransaction
      await productTransaction.destroy({ transaction });

      // Commit transaction
      await transaction?.commit();

      res.status(200).json({
        message: 'ProductTransaction and related ProductTransactionDetails deleted successfully',
      });
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await transaction?.rollback();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error deleting ProductTransaction',
        error: errorMessage,
      });
    }
  }
}
ProductTransactionController.pageTitles = {
  createProductTransaction: 'Tạo giao dịch sản phẩm',
  updateProductTransaction: 'Cập nhật giao dịch sản phẩm',
};
export default ProductTransactionController;