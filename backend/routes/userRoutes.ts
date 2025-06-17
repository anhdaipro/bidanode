import { Router } from 'express';
import UserController from '@backend/controllers/UserController';
import { authenticateJWT } from '@backend/middleware';

const router = Router();

// Đăng nhập
router.post('/login', UserController.login);
// Lấy danh sách tất cả người dùng
router.post('/refresh', UserController.refreshToken);
router.post('/customer/create', UserController.createCustomer);
router.post('/customer/update/:id', UserController.updateCustomer);
router.post('/find-customer', UserController.getUserByPhone);
router.get('/customer', UserController.getAllCustomer);
router.get('/customer/search', UserController.searchCustomer);

// // Lấy thông tin người dùng theo ID
router.get('/user/:id', UserController.getUserById);

// // Cập nhật thông tin người dùng
router.post('/logout', authenticateJWT, UserController.logout);

// // Xóa người dùng
// router.delete('/users/:id', UserController.deleteUser);

export default router;