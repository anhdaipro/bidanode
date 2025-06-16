import express from 'express';
import ShiftController from '../controllers/ShiftController';

const router = express.Router();

router.post('/create', ShiftController.createShift); // Tạo ca làm việc
router.get('', ShiftController.getAllShifts); // Lấy danh sách ca làm việc
router.get('/view/:id', ShiftController.getShiftById); // Lấy thông tin ca làm việc theo ID
router.post('/update/:id', ShiftController.updateShift); // Cập nhật ca làm việc
router.post('/delete/:id', ShiftController.deleteShift); // Xóa ca làm việc
export default router