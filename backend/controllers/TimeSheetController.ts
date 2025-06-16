
import { verifyQrToken } from '../utils/verifyQrToken';
import TimeSheet, { TYPE_CHECKIN, TYPE_CHECKOUT } from '../models/TimeSheet';
import { Request, Response } from 'express';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { addDay } from '../Format';
import User from '../models/User';
import Schedule from '../models/Schedule';
import { STATUS_ACTIVE } from '@form/shifth';
import Shift from '../models/Shift';
class TimeSheetController {
  // Check-in
  public static async checkIn(req: Request, res: Response): Promise<void> {
    const { location,type,shiftId } = req.body;
    try {
      console.log('Location:', location);
      const employeeId = req.user?.id;
      if (!employeeId) {
        res.status(400).json({ message: 'Không thể lấy ID người dùng' });
        return;
      }
      const shift = await Shift.findByPk(shiftId)
      if(!shift){
        res.status(400).json({ message: 'Không có ca này' });
        return 
      }
      // Kiểm tra xem nhân viên đã check-in checkout chưa
      const mTimeSheet = new TimeSheet();
      Object.assign(mTimeSheet, { employeeId, type,shiftId });
      const existingTimeSheet = await mTimeSheet.getByType();
      let responseData = null;
      let message = '';
      const today = dayjs();
      if (type === TYPE_CHECKIN) {
        const schedule = await Schedule.findOne({
          where: {
            employeeId,
            workDate: today.format('YYYY-MM-DD'),
            shiftId: shiftId, // Lấy theo ca làm việc
            status: STATUS_ACTIVE, // Chỉ lấy lịch làm việc hợp lệ
          },
        });
        if(!schedule) {
          res.status(400).json({ message: 'Không tìm thấy lịch làm việc cho nhân viên này ngày hôm nay.' });
          return;
        }
        const {startTime, endTime,workDate} = schedule;
        const startDatetime = dayjs(`${workDate} ${startTime}`);
        const todayDatetime = dayjs(`${today.format('YYYY-MM-DD')}`);
        if(startDatetime.diff(todayDatetime, 'minute') > 20) {
          res.status(400).json({ message: 'Bạn không thể check-in trước 20 phút so với giờ làm việc.' });
          return;
        }
        if (existingTimeSheet) {
          res.status(400).json({ message: 'Nhân viên đã check-in ngày hôm nay.' });
          return;
        }
        
        const newTimeSheet = await TimeSheet.create({
          employeeId,
          checkInTime: dayjs().format('YYYY-MM-DD HH:mm'),
          location,
          shiftId,
          scheduleId: schedule.id, // Lưu ID lịch làm việc
        });

        responseData = newTimeSheet;
        message = 'Check-in thành công.';

      } else if (type === TYPE_CHECKOUT) {
        if (!existingTimeSheet) {
          res.status(400).json({ message: 'Không tìm thấy bản ghi check-in chưa check-out.' });
          return;
        }
        existingTimeSheet.checkOutTime = dayjs().format('YYYY-MM-DD HH:mm');
        await existingTimeSheet.save();
        responseData = existingTimeSheet;
        message = 'Check-out thành công.';
      } else {
        res.status(400).json({ message: 'Loại thao tác không hợp lệ.' });
        return;
      }

      res.status(201).json({
        message,
        data: responseData,
      });
    } catch (error) {
      const message = type == TYPE_CHECKIN ? 'Lỗi khi check-in.' : 'Lỗi khi check-out.';
      res.status(500).json({
        message: message,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Check-out
  public static async checkOut(req: Request, res: Response): Promise<void> {
    try {
      const { location } = req.body;
      const employeeId = req.user?.id
      if (!employeeId) {
        res.status(400).json({ message: 'Không thể lấy ID người dùng' });
        return;
      }
      // Tìm bản ghi check-in chưa check-out
      const existingTimeSheet = await TimeSheet.findOne({
        where: {
          employeeId,
          checkInTime: { [Op.ne]: null }, // Đã check-in
          checkOutTime: null, // Chưa check-out
        },
      });

      if (!existingTimeSheet) {
        res.status(400).json({ message: 'Không tìm thấy bản ghi check-in chưa check-out.' });
        return;
      }

      // Cập nhật thời gian check-out
      existingTimeSheet.checkOutTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
      await existingTimeSheet.save();

      res.status(200).json({
        message: 'Check-out thành công.',
        data: existingTimeSheet,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Lỗi khi check-out.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  public static async actionCreate(req: Request, res: Response): Promise<void> {
      try {
        const { qrData } = req.body;
        // Xác thực mã QR
        const employeeId = verifyQrToken(qrData);
        if (!employeeId) {
          res.status(400).json({ message: 'Mã QR không hợp lệ' });
        }
  
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
  
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
  
        // Tìm các bản ghi chấm công hôm nay của nhân viên
        const timeSheetExist = await TimeSheet.findOne({
          where: {
            employeeId,
            checkInTime: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        });
  
        let type = 'IN';

        if (!timeSheetExist){
          type = 'IN';
        } else if (timeSheetExist) {
          type = 'OUT';
        } else {
          res.status(404).json({
            message: 'Bạn đã chấm công đủ hôm nay',
          });
          return;
        }
        if (timeSheetExist) {
          // Cập nhật thời gian ra cho bản ghi đã tồn tại
          await timeSheetExist.update({
            checkOutTime: now,
          });
        }else{
          await TimeSheet.create({
            data: {
              employeeId,
              checkInTime: now,
            },
          });
        }
        // Tạo bản ghi chấm công mới
        res.status(200).json({ message: `Chấm công ${type === 'IN' ? 'vào' : 'ra'} lúc ${now.toLocaleTimeString()}`,});
      } catch (error) {
        console.error('Lỗi khi chấm công:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi chấm công' });
      }
  }
     // Action: Cập nhật bản ghi chấm công
  public static async actionUpdate(req: Request, res: Response): Promise<void> {
      try {
        const { id } = req.params;
        const { checkInTime, checkOutTime } = req.body;
  
        const timesheet = await TimeSheet.findByPk(id);
  
        if (!timesheet) {
          res.status(404).json({
            message: 'Table session not found',
          });
          return;
        }
  
        await timesheet.update({
          checkInTime,
          checkOutTime,
        });
  
        res.status(200).json({
          message: 'Table session updated successfully',
          data: timesheet,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
          message: 'Error updating table session',
          error: errorMessage,
        });
      }
  }

  // Action: Xem chi tiết bản ghi chấm công
  public static async actionView(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const timeSheet = await TimeSheet.findByPk(id);
      if (!timeSheet) {
        res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công' });
        return;
      }

      res.status(200).json({ message: 'Lấy thông tin thành công', data: timeSheet });
    } catch (error) {
      console.error('Lỗi khi lấy thông tin bản ghi chấm công:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy thông tin bản ghi chấm công' });
    }
  }

  // Action: Lấy danh sách tất cả bản ghi chấm công
  public static async actionIndex(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, employeeId, dateFrom, dateTo,status,roleId } = req.query;
      const pageNumber = parseInt(page as string, 10) || 1;
      const limitNumber = parseInt(limit as string, 10) || 20;
      // Tính toán offset
      const offset = (pageNumber - 1) * limitNumber;
  
      // Tạo điều kiện tìm kiếm
      const where:any = {};
      if (employeeId) {
        where.employeeId = employeeId; // Tìm kiếm theo tên (LIKE '%name%')
      }
      if(roleId){
        const aEmployeeId = (new User).getUserByRole(Number(roleId))
        where.employeeId = {[Op.in]: aEmployeeId}
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
      const { rows: TimeSheets, count: total } = await TimeSheet.findAndCountAll({
        where,
        limit: limitNumber,
        offset,
        include: [
          { model: User, as: 'rEmployee', attributes:['roleId', 'name', 'phone']},
        ],
        distinct: true,
        order: [['id', 'DESC']],
      });
      // Tính tổng số trang
      const totalPages = Math.ceil(total / limitNumber);
    
      res.status(200).json({
        message: 'Table sessions retrieved successfully',
        data: TimeSheets,
        pagination: {
          total,
          totalPages,
          currentPage: pageNumber,
          limit: limitNumber,
        },
      });

    } catch (error) {
      console.error('Lỗi khi lấy danh sách bản ghi chấm công:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách bản ghi chấm công' });
    }
  }
}
export default TimeSheetController;


