import { Request, Response } from 'express';
import TableSession from '../models/TableSession';
import BilliardTable from '../models/BilliardTable';
import TableOrderDetail from '../models/TableOrder';
import {Op} from 'sequelize'
import { STATUS_AVAILABLE, STATUS_PAID, STATUS_PLAYING, STATUS_WAIT_PAID } from '@form/billiardTable';
import { addDay } from '../Format';
import User from '../models/User';
import Reward from '../models/Reward';
import { ChangeLog } from '@type/Model';
import LogUpdate, { TYPE_SESSION } from '../models/LogUpdate';
import { PageTitlesMap } from '@type/controller';
type TableOrderItem = {
  sessionId: string;
  productId: number;
  quantity: number;
  price: number;
  categoryId: number;
  createdAt: Date;
  createdAtBigint: number;
  totalPrice: number;
  uidLogin: number;
};
class TableSessionController {
  static pageTitles: PageTitlesMap = {
    createTableSession: 'Tạo phiên chơi',
    updateTableSession: 'Cập nhật phiên chơi',
    getAllTableSessions: 'Danh sách phiên chơi',
    getTableSessionById: 'Thông tin phiên chơi',
    deleteTableSession: 'Xóa phiên chơi',
    startTableSession: 'Bắt đầu phiên chơi',
    orderProductTableSession:'Đặt món trong phiên chơi',
    finishTableSession:'Kết thúc phiên chơi',
};
  // Tạo một phiên chơi mới
  public static async createTableSession(req: Request, res: Response): Promise<void> {
    const transaction = await TableSession.sequelize?.transaction(); // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
    try {
      const {tableId,startTime, endTime, status, paymentMethod, orders, amountOrder} = req.body;
      const uidLogin = req.user?.id
      if (!uidLogin) {
        res.status(400).json({ message: 'Không thể lấy ID người dùng' });
        return;
      }
      const table = await BilliardTable.findByPk(tableId)
      if(!table){
        res.status(404).json({
          message:'Bàn không thấy'
        })
        return;
      }
      const tableSession = new TableSession()
      Object.assign(tableSession,{tableId,
        startTime,
        endTime,
        isActive: true,
        createdAtBigint: Date.now(),
        playedMinutes: 0,
        status,
        paymentMethod,
        uidLogin,
      })
      if(tableSession.endTime){
        const playedMinutes = tableSession.fnCalculatePlayedMinutes();
        tableSession.playedMinutes = playedMinutes;
        const hourlyRate = table.hourlyRate
        const price = (playedMinutes / 60) * hourlyRate;
        const roundedPrice = Math.round(price / 1000) * 1000;
        tableSession.amountTable = roundedPrice;
        tableSession.totalAmount = amountOrder + roundedPrice
      }
      tableSession.validateCreate()
      if(Object.keys(tableSession.errors).length > 0){
          res.status(400).json({
            message:'Lỗi valid',
            error:tableSession.errors,
          })
      }
      await tableSession.save()
      table.status = status == STATUS_PAID ? STATUS_AVAILABLE : status
      await table.save()
      const createdAt = new Date()
      const aDetail = orders.map(({productId, quantity, price, categoryId}:TableOrderDetail)=>({
        sessionId: tableSession.id,
        productId,
        quantity,
        price,
        categoryId,
        createdAt,
        createdAtBigint: createdAt.getTime(),
        totalPrice: quantity * price,
        uidLogin,
      }))
      await TableOrderDetail.bulkCreate(aDetail, { transaction });
      await transaction?.commit();
      res.status(201).json({
        message: 'Table session created successfully',
        data: tableSession,
      });
    } catch (error) {
      await transaction?.rollback();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error creating table session',
        error: errorMessage,
      });
    }
  }
  //bắt đầu sesion mới
  public static async startTableSession(req: Request, res: Response): Promise<void> {
    try {
      const { tableId} = req.body;
      const uidLogin = req.user?.id
      if (!uidLogin) {
        res.status(400).json({ message: 'Không thể lấy ID người dùng' });
        return;
      }
      const startTime = new Date();
      const table = await BilliardTable.findByPk(tableId)
      if(!table){
        res.status(404).json({
          message:'Bàn không thấy'
        })
        return;
      }
      const tableSession = await TableSession.create({
        tableId,
        startTime,
        isActive: true,
        createdAtBigint: Date.now(),
        playedMinutes: 0,
        status:STATUS_PLAYING,
        uidLogin,
      });
      table.status =  STATUS_PLAYING
      await table.save()
      res.status(201).json({
        message: 'Table session created successfully',
        data: tableSession,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error creating table session',
        error: errorMessage,
      });
    }
  }
  
  // Lấy danh sách tất cả các phiên chơi
  public static async getAllTableSessions(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, codeNo, dateFrom, dateTo,status } = req.query;
      const pageNumber = parseInt(page as string, 10) || 1;
      const limitNumber = parseInt(limit as string, 10) || 20;
      // Tính toán offset
      const offset = (pageNumber - 1) * limitNumber;
  
      // Tạo điều kiện tìm kiếm
      const where:any = {};
      if (codeNo) {
        where.codeNo = codeNo; // Tìm kiếm theo tên (LIKE '%name%')
      }
      if (status) {
        where.status = status; // Tìm kiếm theo trạng thái
      }
      if (dateFrom || dateTo) {
        where.createdAt = {
          ...(dateFrom && { [Op.gte]: dateFrom }), // Ngày bắt đầu
          ...(dateTo && { [Op.lte]: addDay(dateTo as string,1)  }), // Ngày kết thúc
        };
      }
      // Truy vấn cơ sở dữ liệu với phân trang và điều kiện tìm kiếm
      const { rows: tabelSessions, count: total } = await TableSession.findAndCountAll({
        where,
        limit: limitNumber,
        offset,
        include: [
          { model: BilliardTable, as: 'table' },
          { model: TableOrderDetail, as: 'orders' },
          { model: User, as: 'rUidLogin', attributes:['name']},
          { model: User, as: 'customer', attributes:['name', 'phone']}
        ],
        distinct: true,
        order: [['id', 'DESC']],
      });
      // Tính tổng số trang
      const totalPages = Math.ceil(total / limitNumber);
    
      res.status(200).json({
        message: 'Table sessions retrieved successfully',
        data: tabelSessions,
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
        message: 'Error retrieving table sessions',
        error: errorMessage,
      });
    }
  }

  // Lấy thông tin một phiên chơi theo ID
  public static async getTableSessionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const tableSession = await TableSession.findByPk(id, {
        include: [{ model: TableOrderDetail, as: 'orders' }],
      });

      if (!tableSession) {
        res.status(404).json({
          message: 'Table session not found',
        });
      }

      res.status(200).json({
        message: 'Table session retrieved successfully',
        data: tableSession,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving table session',
        error: errorMessage,
      });
    }
  }

  // Cập nhật thông tin một phiên chơi
  public static async updateTableSession(req: Request, res: Response): Promise<void> {
    const transaction = await TableSession.sequelize?.transaction(); // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
    try {
      const { id } = req.params;
      const { playerName, phone, startTime, endTime, status,orders,tableId,amountOrder } = req.body;
      const uidLogin = req.user?.id
      if (!uidLogin) {
        res.status(400).json({ message: 'Không thể lấy ID người dùng' });
        return;
      }
      
      const tableSession = await TableSession.findByPk(id);
      if (!tableSession) {
        res.status(404).json({
          message: 'Table session not found',
        });
        return;
      }
      const table = await BilliardTable.findByPk(tableId)
      if(!table){
        res.status(404).json({
          message:'Bàn không thấy'
        })
        return;
      }
      // 2. So sánh thay đổi
      const updates:any = { playerName, phone, startTime, endTime, status };
      const changes:ChangeLog = {};
      for (const key in updates) {
        const oldValue = (tableSession as any)[key];
        if (oldValue != updates[key]) {
          changes[key] = {
            old: oldValue,
            new: updates[key],
          };
        }
      }
      await TableOrderDetail.destroy({
        where: { sessionId: id },
      });
      Object.assign(tableSession, updates)
      if(tableSession.endTime){
        const playedMinutes = tableSession.fnCalculatePlayedMinutes();
        tableSession.playedMinutes = playedMinutes;
        const hourlyRate = table.hourlyRate
        const price = (playedMinutes / 60) * hourlyRate;
        const roundedPrice = Math.round(price / 1000) * 1000;
        tableSession.amountTable = roundedPrice;
        tableSession.totalAmount = amountOrder + roundedPrice
      }
      await tableSession.save();
      const createdAt = new Date()
      const aDetail = orders.map(({productId, quantity, price, categoryId}:TableOrderDetail)=>({
        sessionId: tableSession.id,
        productId,
        quantity,
        price,
        categoryId,
        createdAt,
        createdAtBigint: createdAt.getTime(),
        totalPrice: quantity * price,
        uidLogin,
      }))
      await TableOrderDetail.bulkCreate(aDetail, {transaction});
      if (Object.keys(changes).length > 0) {
        await LogUpdate.create({
          userId: uidLogin,
          belongId:id,
          type:TYPE_SESSION,
          roleId: req.user?.roleId,
          changes,
        });
      }
      await transaction?.commit()
      res.status(200).json({
        message: 'Table session updated successfully',
        data: tableSession,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error updating table session',
        error: errorMessage,
      });
    }
  }

  // Xóa một phiên chơi
  public static async deleteTableSession(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const tableSession = await TableSession.findByPk(id);

      if (!tableSession) {
        res.status(404).json({
          message: 'Table session not found',
        });
        return;
      }

      await tableSession.destroy();

      res.status(200).json({
        message: 'Table session deleted successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error deleting table session',
        error: errorMessage,
      });
    }
  }
  // Kết thúc một phiên chơi
  public static async finishTableSession(req: Request, res: Response): Promise<void> {
    try {
      const {id} = req.params
      const {tableId} = req.body;
      const tableSession = await TableSession.findByPk(id);
      const table = await BilliardTable.findByPk(tableId);
      if (!tableSession || !table) {
        res.status(404).json({
          message: 'Bàn không tồn tại hoặc phiên chơi không tồn tại',
        });
        return;
      }
      tableSession.endTime = new Date();
      const playedMinutes = tableSession.fnCalculatePlayedMinutes();
      tableSession.playedMinutes = playedMinutes;
      const hourlyRate = table.hourlyRate
      const price = (playedMinutes / 60) * hourlyRate;
      const roundedPrice = Math.round(price / 1000) * 1000;
      tableSession.amountTable = roundedPrice;
      tableSession.status = STATUS_WAIT_PAID
      await tableSession.save();
      table.status = STATUS_WAIT_PAID
      await table.save();
      res.status(200).json({
        message: 'kết thúc phiên thành công',
        data:tableSession
      });
    }catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error adding order product to table session',
        error: errorMessage,
      });
    }
  }
  public static async loadModel(id:number){
    const tableSession = await TableSession.findByPk(id);
    if (!tableSession) {
      return null;
    }
    return tableSession

  }
  public static async orderProductTableSession(req: Request, res: Response): Promise<void> {
    const transaction = await TableSession.sequelize?.transaction(); // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
    try {
      const { id } = req.params;
      const { orders } = req.body;
      const uidLogin = req.user?.id
      if (!uidLogin) {
        res.status(400).json({ message: 'Không thể lấy ID người dùng' });
        return;
      }
      const tableSession = await TableSession.findByPk(id);
      if(!tableSession){
        res.status(400).json({ message: 'Phiên không tồn tại' });
        return;
      }
      // Xóa các ProductTransactionDetail cũ
      await TableOrderDetail.destroy({
        where: { sessionId: id },
        transaction,
      });
      const createdAt = new Date()
      let tableOrderDetails: TableOrderItem[] = [];
      let amountOrder = 0;
      orders.forEach(({productId, quantity, price,categoryId}: TableOrderDetail) => {
        const totalPrice = quantity * price
        tableOrderDetails.push({
          sessionId: id,
          productId,
          quantity,
          price,
          categoryId,
          createdAt,
          createdAtBigint: createdAt.getTime(),
          totalPrice,
          uidLogin,
        })
        amountOrder += totalPrice
      });
      await TableOrderDetail.bulkCreate(tableOrderDetails, { transaction });
      tableSession.amountOrder = amountOrder
      await tableSession.save();
      await transaction?.commit();
      res.status(200).json({
        message: 'Order product added to table session successfully',
        data:tableOrderDetails
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error adding order product to table session',
        error: errorMessage,
      });
    }
  }
  public static async createRewardTableSession(req: Request, res: Response): Promise<void> {
    const transaction = await TableSession.sequelize?.transaction(); // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
    try {
      const {id} = req.params
      const {phone} = req.body;
      const uidLogin = req.user?.id
      if (!uidLogin) {
        res.status(400).json({ message: 'Không thể lấy ID người dùng' });
        return;
      }
      let user = await User.findOne({
        where:{phone}
      })
      if(!user){
        user = await (new User).createCustomer(phone)
      }
      const tableSession = await TableSession.findByPk(id);
      if (!tableSession) {
        res.status(404).json({
          message: 'Phiên chơi không tồn tại',
        });
        return;
      }
      const playedMinutes = tableSession.playedMinutes
      let point = Math.floor(playedMinutes/10);
      point += Math.floor(tableSession.amountOrder/10000)
      tableSession.phone = phone;
      tableSession.customerId = user.id;
      await tableSession.save()
      await Reward.create({
        sessionId:id,
        customerId: user.id,
        uidLogin,
        point,
        phone,
      })
      user.point += point
      await user.save()
      res.status(200).json({
        message:'Tích điểm thành công',
        data:user
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error adding order product to table session',
        error: errorMessage,
      });
    }
  }
  public static async applyRewardTableSession(req: Request, res: Response): Promise<void> {
    const transaction = await TableSession.sequelize?.transaction(); // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
    try {
      const {id} = req.params
      const {userId,totalAmount} = req.body;
      const uidLogin = req.user?.id
      if (!uidLogin) {
        res.status(400).json({ message: 'Không thể lấy ID người dùng' });
        return;
      }
      const user = await User.findOne({
        where:{userId}
      })
      if (!user) {
        res.status(400).json({ message: 'khách hàng không tồn tại' });
        return;
      }
      const tableSession = await TableSession.findByPk(id);
      if (!tableSession) {
        res.status(404).json({
          message: 'Phiên chơi không tồn tại',
        });
        return;
      }
      const point = user.point
      const pointUse =  Math.floor(point / 100)
      const discountAmount = pointUse * 10000; // 100 điểm = 10.000đ
      tableSession.discountAmount = discountAmount
      tableSession.customerId = user.id
      await tableSession.save()
      user.point -= pointUse
      await user.save()
      res.status(200).json({
        message:'Tích điểm thành công',
        data:user
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error adding order product to table session',
        error: errorMessage,
      });
    }
  }
}

export default TableSessionController;