import express from 'express';
import ScheduleController from '../controllers/ScheduleController';
import { authenticateJWT } from '../middleware';

const router = express.Router();
router.use(authenticateJWT)
router.post('/create', ScheduleController.createSchedules); // Tạo nhiều lịch làm việc
router.get('', ScheduleController.getAllSchedules); // Lấy danh sách lịch làm việc
router.get('/weekly', ScheduleController.getWeeklySchedules); // Lấy danh sách lịch làm việc
router.post('/update', ScheduleController.updateSchedules); // Cập nhật nhiều lịch làm việc
router.post('/delete/:id', ScheduleController.deleteSchedule); // Xóa lịch làm việc
router.get('/cron',ScheduleController.cronSchedule)

export default router;