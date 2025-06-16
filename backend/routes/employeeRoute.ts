import { Router } from 'express';
import EmployeeController from '../controllers/EmployeeController';
import { authenticateJWT } from '../middleware';

const router = Router();
export const folder = '/uploads/user'

// Tạo người dùng mới
router.use(authenticateJWT);
router.post('/create', EmployeeController.createEmployee);
router.post('/update/:id', EmployeeController.updateEmployee);
router.get('', EmployeeController.getAllEmployee);
router.get('/view/:id', EmployeeController.getEmployeeById);
router.get('/schedule', EmployeeController.getEmployeeSchedule);
// // Cập nhật thông tin người dùng
// router.put('/users/:id', UserController.updateUser);

// // Xóa người dùng
// router.delete('/users/:id', UserController.deleteUser);

export default router;