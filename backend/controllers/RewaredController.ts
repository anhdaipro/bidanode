import { Request, Response } from 'express';
import TableSession from '../models/TableSession';
import BilliardTable from '../models/BilliardTable';
import TableOrderDetail from '../models/TableOrder';
import {Op} from 'sequelize'
import { STATUS_AVAILABLE, STATUS_PAID, STATUS_PLAYING, STATUS_WAIT_PAID } from '@form/billiardTable';
import { addDay } from '../Format';
import User from '../models/User';

class RewaredController {
  // Tạo một phiên chơi mới
  public static async createTableSession(req: Request, res: Response): Promise<void> {
    const transaction = await TableSession.sequelize?.transaction(); // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
    try {
      const {tableId,startTime, endTime, status, paymentMethod, orders, totalAmount} = req.body;
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
      })
      if(tableSession.endTime){
        const playedMinutes = tableSession.fnCalculatePlayedMinutes();
        tableSession.playedMinutes = playedMinutes;
        const hourlyRate = table.hourlyRate
        const price = (playedMinutes / 60) * hourlyRate;
        const roundedPrice = Math.round(price / 1000) * 1000;
        tableSession.amountTable = roundedPrice;
        tableSession.totalAmount = totalAmount + roundedPrice
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
  public static async getTablePlaying(req: Request, res: Response): Promise<void> {
    try {
      const tableSessions = await TableSession.findAll({
        where: {
          isActive: true,
        },
      });
      res.status(201).json({
        message: 'Table sessions retrieved successfully',
        data: tableSessions,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving table sessions',
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
          { model: User, as: 'rUidLogin', attributes:['name']}
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
    try {
      const { id } = req.params;
      const { playerName, phone, startTime, endTime, status } = req.body;

      const tableSession = await TableSession.findByPk(id);

      if (!tableSession) {
        res.status(404).json({
          message: 'Table session not found',
        });
        return;
      }
      if(status){
        tableSession.status = status
      }
      if(endTime){
        tableSession.endTime = endTime
      }
      if(startTime){
        tableSession.startTime = startTime
      }
      if(playerName){
        tableSession.playerName = playerName
      }
      if(phone){
        tableSession.phone = phone
      }
      await tableSession.save();

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
      // Xóa các ProductTransactionDetail cũ
      await TableOrderDetail.destroy({
        where: { sessionId: id },
        transaction,
      });
      const createdAt = new Date()
      const tableOrderDetails = orders.map(({productId, quantity, price,categoryId}: TableOrderDetail) => ({
        sessionId: id,
        productId,
        quantity,
        price,
        categoryId,
        createdAt,
        createdAtBigint: createdAt.getTime(),
        totalPrice: quantity * price,
        uidLogin,
      }));
      await TableOrderDetail.bulkCreate(tableOrderDetails, { transaction });
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
}

export default RewaredController;