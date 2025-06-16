import { Request, Response } from 'express';
import BilliardTable from '../models/BilliardTable';
import TableSession from '../models/TableSession';
import TableOrderDetail from '../models/TableOrder';
import { Op } from 'sequelize';
import { LSTATUSACTIVE } from '@form/tableSession';
import { LSESSIONACTIVE } from '@form/billiardTable';
import User from '../models/User';
import { ChangeLog } from '@type/Model';
import LogUpdate, { TYPE_TABLE } from '../models/LogUpdate';
import { PageTitlesMap } from '@type/controller';

class BilliardTableController {
    static pageTitles: PageTitlesMap = {
        createProductTransaction: 'Tạo giao dịch sản phẩm',
        updateProductTransaction: 'Cập nhật giao dịch sản phẩm',
        getAllProductTransactions: 'Danh sách giao dịch',
        getProductTransactionById: 'Thông tin giao dịch',
        deleteProductTransaction: 'Xóa giao dịch',
    
        // Các action khác
        createBilliardTable: 'Tạo bàn billiard',
        updateBilliardTable: 'Cập nhật bàn billiard',
        getAllBilliardTables: 'Danh sách bàn billiard',
        getBilliardTableById: 'Thông tin bàn billiard',
        deleteBilliardTable: 'Xóa bàn billiard',
    
        createTableSession: 'Tạo phiên chơi',
        updateTableSession: 'Cập nhật phiên chơi',
        getAllTableSessions: 'Danh sách phiên chơi',
        getTableSessionById: 'Thông tin phiên chơi',
        deleteTableSession: 'Xóa phiên chơi',
    
        createTableOrder: 'Tạo đơn hàng bàn',
        updateTableOrder: 'Cập nhật đơn hàng bàn',
        getAllTableOrders: 'Danh sách đơn hàng bàn',
        getTableOrderById: 'Thông tin đơn hàng bàn',
        deleteTableOrder: 'Xóa đơn hàng bàn',
    };
  // Lấy danh sách tất cả bàn billiard
    public static async getAll(req: Request, res: Response): Promise<void> {
        try {
        const tables = await BilliardTable.findAll();
        res.status(200).json(tables);
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
        }
    }
    // Lấy danh sách bàn billiard đang hoạt động
    public static async getActiveTables(req: Request, res: Response): Promise<void> {
        try {
        const aTable = await BilliardTable.findAll({
            
        });
        const aModelTableSession = await TableSession.findAll({
            where: { status:  {[Op.in]: LSESSIONACTIVE } },
            include: [
                { model: TableOrderDetail, as: 'orders' },
                { model: User, as: 'customer',attributes: ['point', 'id', 'phone'] }
            ],
        });
        const aTableSession = await Promise.all(aModelTableSession.map( async (tableSession) =>{
            const startTime = new Date(tableSession.startTime).getTime();
            const now = tableSession.endTime ? new Date(tableSession.endTime).getTime() : Date.now();
            const playedMinutes = Math.floor((now - startTime) / 60000);
            return {
                ...tableSession.toJSON(), playedMinutes: playedMinutes,
            }
        }))
        const aData = {
            tables:aTable,
            tableSessions: aTableSession
        }
        res.status(201).json({data:aData, message: 'Lấy danh sách bàn billiard thành công'});
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
        }
    }
    // Lấy thông tin chi tiết của một bàn billiard
    public static async getById(req: Request, res: Response): Promise<void> {
        try {
        const { id } = req.params;
        const table = await BilliardTable.findByPk(id);

        if (!table) {
            res.status(404).json({ message: 'Không tìm thấy bàn billiard' });
            return;
        }
        res.status(201).json({
            message: 'Product retrieved successfully',
            data: table,
        });
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin bàn billiard' });
        }
    }

    // Tạo mới một bàn billiard
    public static async create(req: Request, res: Response): Promise<void> {
        try {
            const { tableNumber, status, type, hourlyRate } = req.body;
            // Kiểm tra xem bàn billiard đã tồn tại chưa
            const existingTable = await BilliardTable.findOne({ where: { tableNumber } });
            if (existingTable) {
                res.status(400).json({ message: 'Bàn billiard đã tồn tại' });
            }
            const newTable = await BilliardTable.create({
                tableNumber,
                status,
                type,
                hourlyRate: hourlyRate,
            });
            res.status(201).json({data:newTable,  message: 'Tạo bàn billiard thành công' });
        } catch (error) {
        console.error(error);
            res.status(500).json({ message: 'Lỗi khi tạo bàn billiard' });
        }
    }

    // Cập nhật thông tin một bàn billiard
    public static async update(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { tableNumber, status, type, hourlyRate } = req.body;
            const uidLogin = req.user?.id
            if (!uidLogin) {
              res.status(400).json({ message: 'Không thể lấy ID người dùng' });
              return;
            }
            const table = await BilliardTable.findByPk(id);

            if (!table) {
                res.status(404).json({ message: 'Không tìm thấy bàn billiard' });
                return;
            }
            // 2. So sánh thay đổi
            const updates:any = { tableNumber, status, type, hourlyRate };
            const changes:ChangeLog = {};
            for (const key in updates) {
                const oldValue = (table as any)[key];
                if (oldValue != updates[key]) {
                    changes[key] = {
                    old: oldValue,
                    new: updates[key],
                    };
                }
            }
            await table.update({
                tableNumber,
                status,
                type,
                hourlyRate: hourlyRate,
            });
            if (Object.keys(changes).length > 0) {
                await LogUpdate.create({
                  userId: uidLogin,
                  belongId:table.id,
                  type:TYPE_TABLE,
                  roleId: req.user?.roleId,
                  changes,
                });
              }
            res.status(200).json({
                message: 'Product retrieved successfully',
                data: table,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi khi cập nhật bàn billiard' });
        }
    }

    // Xóa một bàn billiard
    public static async delete(req: Request, res: Response): Promise<void> {
        try {
        const { id } = req.params;

        const table = await BilliardTable.findByPk(id);

        if (!table) {
            res.status(404).json({ message: 'Không tìm thấy bàn billiard' });
            return;
        }

        await table.destroy();

        res.status(200).json({ message: 'Xóa bàn billiard thành công' });
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi xóa bàn billiard' });
        }
    }
}

export default BilliardTableController;