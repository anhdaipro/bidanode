import { Request, Response } from 'express';
import Schedule from '../models/Schedule';
import User from '../models/User';
import Shift from '../models/Shift';
import { Op,fn,col } from 'sequelize';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';
import { ROLE_ADMIN } from '@form/user';
dayjs.extend(weekday);
dayjs.extend(isoWeek); // hỗ trợ tuần ISO (Thứ Hai là đầu tuần)
class ScheduleController {
  // Tạo nhiều bản ghi lịch làm việc
  public static async createSchedules(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user
      if(!user){
        res.status(400).json({message:'Không tìm thấy người đăng nhập'})
        return;
      }
      const {id:userId,roleId} = user
      const {records, workDate} = req.body; // Mảng các bản ghi lịch làm việc
      if(!dayjs().isBefore(dayjs(workDate), 'day') && roleId != ROLE_ADMIN) {
        res.status(400).json({ message: 'Ngày làm việc lớn hơn ngày hiện tại.' });
        return;
      }
      if (!Array.isArray(records) || records.length === 0) {
        res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
        return;
      }
      let aInsert = [];
      const aEmployeeId = new Set()
      for (const schedule of records) {
        if(!schedule.shiftId) {
          continue;
        }
        aEmployeeId.add(schedule.employeeId); // Lưu các shiftId đã có
        aInsert.push({
          ...schedule,
          createdBy:userId,
          createdAtBigint:dayjs().unix(),
          workDate: workDate,
        workDateBigint:dayjs(workDate).unix(),
        });
      }
      await Schedule.destroy({
        where: {
          workDate: workDate, // Xóa tất cả lịch làm việc trong ngày này
          employeeId: {[Op.in]: Array.from(aEmployeeId)}, // Chỉ xóa các ca làm việc đã có trong mảng aShiftId
        },
      });
      const createdSchedules = await Schedule.bulkCreate(aInsert);
      
      res.status(201).json({
        message: 'Tạo lịch làm việc thành công.',
        data: createdSchedules,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Lỗi khi tạo lịch làm việc.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Lấy danh sách lịch làm việc
  public static async getAllSchedules(req: Request, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo, roleId } = req.query;

      const where: any = {};
      if(roleId){
        const aEmployeeId = (new User).getUserByRole(Number(roleId))
        where.employeeId = {[Op.in]: aEmployeeId}
      }
      if (dateFrom || dateTo) {
        where.workDate = {
          ...(dateFrom && { [Op.gte]: dateFrom }), // Ngày bắt đầu
          ...(dateTo && { [Op.lte]: dateTo  }), // Ngày kết thúc
        };
      }

      const schedules = await Schedule.findAll({
        where,
        include: [
          {model:User, as: 'rEmployee'}, // Thông tin nhân viên
          {model:Shift, as: 'rShift'}, // Thông tin ca làm việc
        ], // Bao gồm thông tin nhân viên và ca làm việc
      });

      res.status(200).json({
        message: 'Lấy danh sách lịch làm việc thành công.',
        data: schedules,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Lỗi khi lấy danh sách lịch làm việc.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Cập nhật nhiều bản ghi lịch làm việc
  public static async updateSchedules(req: Request, res: Response): Promise<void> {
    try {
      const schedules = req.body.schedules; // Mảng các bản ghi cần cập nhật

      if (!Array.isArray(schedules) || schedules.length === 0) {
        res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
        return;
      }

      const updatedSchedules = [];
      for (const schedule of schedules) {
        const existingSchedule = await Schedule.findByPk(schedule.id);
        if (existingSchedule) {
          await existingSchedule.update(schedule);
          updatedSchedules.push(existingSchedule);
        }
      }

      res.status(200).json({
        message: 'Cập nhật lịch làm việc thành công.',
        data: updatedSchedules,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Lỗi khi cập nhật lịch làm việc.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Xóa lịch làm việc
  public static async deleteSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const schedule = await Schedule.findByPk(id);
      if (!schedule) {
        res.status(404).json({ message: 'Không tìm thấy lịch làm việc.' });
        return;
      }

      await schedule.destroy();

      res.status(200).json({
        message: 'Xóa lịch làm việc thành công.',
      });
    } catch (error) {
      res.status(500).json({
        message: 'Lỗi khi xóa lịch làm việc.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  public static async getWeeklySchedules(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.query;

      if (!date) {
        res.status(400).json({ message: 'Ngày không được cung cấp.' });
        return;
      }

      const inputDate = dayjs(date as string);

      // Tìm ngày bắt đầu tuần (thứ Hai)
      // Ngày bắt đầu tuần (Thứ Hai)
      const startOfWeek = inputDate.weekday(0);

      // Ngày kết thúc tuần (Chủ Nhật)
      const endOfWeek = startOfWeek.add(6, 'day');
      console.log(`Lấy lịch từ ${startOfWeek.format('YYYY-MM-DD')} đến ${endOfWeek.format('YYYY-MM-DD')}`);
      // Lấy dữ liệu từ bảng Schedule theo tuần
      const schedules = await Schedule.findAll({
        attributes: [ 
          'shiftId', 
          'workDate', 
          [fn('COUNT', col('employee_id')), 'numEmployee'], // Đếm số lượng nhân viên
          [fn('GROUP_CONCAT', col('employee_id')), 'aEmployeeId'], // Nối chuỗi các employee_id
        ],
        where: {
          workDate: {
            [Op.between]: [startOfWeek.format('YYYY-MM-DD'), endOfWeek.format('YYYY-MM-DD')], // Lọc theo khoảng thời gian từ Thứ Hai đến Chủ Nhật
          },
        },
        group: ['workDate', 'shiftId'],
        order: [['workDate', 'ASC'], ['shiftId', 'ASC']],
      });
      // Chuyển đổi dữ liệu để dễ sử dụng
      const data = schedules.map(schedule => ({
        ...schedule.get(),
        aEmployeeId: schedule.getDataValue('aEmployeeId') ? schedule.getDataValue('aEmployeeId').split(',') : [],
      }));
      res.status(200).json({
        message: 'Lấy dữ liệu theo tuần thành công.',
        data: data,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Lỗi khi lấy dữ liệu theo tuần.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  public static async cronSchedule(req: Request, res: Response): Promise<void> {
    (new Schedule).updateStatusAndSalary();
    res.status(200).json({message:  '0k'})

  }
}

export default ScheduleController;