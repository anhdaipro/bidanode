import { Request, Response } from 'express';
import Shift from '../models/Shift'; // Đường dẫn tới model Shift
import { Op } from 'sequelize';

class ShiftController {
  // Tạo mới một ca làm việc
  public static async createShift(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, startTime, endTime, status,numEmployee,salaryHour } = req.body;

      const newShift = await Shift.create({
        name,
        description,
        startTime,
        endTime,
        status,
        numEmployee,
        salaryHour,
      });
      await newShift.deleteCache(); // Xóa cache sau khi tạo mới
      res.status(201).json({
        message: 'Tạo ca làm việc thành công.',
        data: newShift,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Lỗi khi tạo ca làm việc.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Lấy danh sách tất cả các ca làm việc
  public static async getAllShifts(req: Request, res: Response): Promise<void> {
    try {
      const shifts = await (new Shift).getAllShift();
      res.status(200).json({
        message: 'Lấy danh sách ca làm việc thành công.',
        data: shifts,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Lỗi khi lấy danh sách ca làm việc.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Lấy thông tin chi tiết một ca làm việc theo ID
  public static async getShiftById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const shift = await Shift.findByPk(id);

      if (!shift) {
        res.status(404).json({
          message: 'Không tìm thấy ca làm việc.',
        });
        return;
      }

      res.status(200).json({
        message: 'Lấy thông tin ca làm việc thành công.',
        data: shift,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Lỗi khi lấy thông tin ca làm việc.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Cập nhật thông tin một ca làm việc
  public static async updateShift(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, startTime, endTime, status,numEmployee,salaryHour } = req.body;

      const shift = await Shift.findByPk(id);

      if (!shift) {
        res.status(404).json({
          message: 'Không tìm thấy ca làm việc.',
        });
        return;
      }

      await shift.update({
        name,
        description,
        startTime,
        endTime,
        status,
        numEmployee,
        salaryHour,
      });
      await shift.deleteCache(); // Xóa cache sau khi update
      res.status(200).json({
        message: 'Cập nhật ca làm việc thành công.',
        data: shift,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Lỗi khi cập nhật ca làm việc.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Xóa một ca làm việc
  public static async deleteShift(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const shift = await Shift.findByPk(id);

      if (!shift) {
        res.status(404).json({
          message: 'Không tìm thấy ca làm việc.',
        });
        return;
      }

      await shift.destroy();

      res.status(200).json({
        message: 'Xóa ca làm việc thành công.',
      });
    } catch (error) {
      res.status(500).json({
        message: 'Lỗi khi xóa ca làm việc.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default ShiftController;