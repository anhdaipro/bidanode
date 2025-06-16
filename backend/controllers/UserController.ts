import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import User from '../models/User';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { JWT_SECRET,REFRESH_TOKEN_SECRET, ROLE_CUSTOMER, STATUS_ACTIVE } from '../BidaConst';
import { addDay } from '../Format';
const refreshTokens: Record<string, number> = {}; // Bộ nhớ tạm (thay bằng DB trong thực tế)
class UserController {
    public static async createCustomer(req: Request, res: Response): Promise<void> {
        try {
            const { phone,name } = req.body;
            const username = phone
            const password = '123123'
            const roleId = ROLE_CUSTOMER;
            const status = STATUS_ACTIVE
            // Kiểm tra xem username hoặc phone đã tồn tại chưa
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: [{ phone }, { phone }],
                    roleId:ROLE_CUSTOMER
                },
            });

            if (existingUser) {
                res.status(400).json({ message: 'Tên người dùng hoặc số điện thoại đã tồn tại' });
                return;
            }

            // Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo người dùng mới
            const newUser = await User.create({
                username,
                phone,
                name,
                status,
                password,
                hashedPassword,
                roleId,
            });

            res.status(201).json({ message: 'Tạo khách hàng thành công', data: newUser });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo người dùng' });
        }
    }
    public static async updateCustomer(req: Request, res: Response): Promise<void> {
        try {
            const {id} = req.params
            const customer =  await User.findByPk(id)
            if(!customer){
                res.status(404).json({ message: 'Người dùng không tồn tại' });
                return;
            }
            const { phone,name,status } = req.body;
            // Kiểm tra xem username hoặc phone đã tồn tại chưa
            const existingUser = await User.findOne({
                where: {
                    phone: phone,
                    roleId:ROLE_CUSTOMER,
                    id: {
                    [Op.ne]: id
                    }
                }
                
            });

            if (existingUser) {
                res.status(400).json({ message: 'Số điện thoại đã tồn tại' });
                return;
            }
            Object.assign(customer,{phone,
                name,
                status,})
            // Mã hóa mật khẩu
            await customer.save()

            res.status(201).json({ message: 'Tạo khách hàng thành công', data: customer });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo người dùng' });
        }
    }
    public static async createUser(req: Request, res: Response): Promise<void> {
        try {
            const { username, phone, password, roleId, address, name, baseSalary,dateOfBirth } = req.body;
            
            // Kiểm tra xem username hoặc phone đã tồn tại chưa
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: [{ username }, { phone }],
                },
            });
            if (existingUser) {
                res.status(400).json({ message: 'Tên người dùng hoặc số điện thoại đã tồn tại' });
                return;
            }

            // Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo người dùng mới
            const newUser = await User.create({
                username,
                phone,
                name,
                password,
                baseSalary,
                dateOfBirth,
                hashedPassword,
                roleId,
                address
            });

            res.status(201).json({ message: 'Người dùng đã được tạo thành công', user: newUser });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo người dùng' });
        }
    }
    public static async login(req: Request, res: Response): Promise<void> {
        try {
            const { identifier, password } = req.body;
            const user = await User.findOne({
                where: {
                [Op.or]: [{ username: identifier }, { phone: identifier }],
                },
                // attributes:['id', 'name', 'username', 'roleId', 'phone', 'status', 'address'],
            });
        
            if (!user) {
                res.status(404).json({ message: 'Người dùng không tồn tại' });
                return;
            }
            const isPasswordValid = user.password && await bcrypt.compare(password, user.hashedPassword);
            if (!isPasswordValid) {
                res.status(401).json({ message: 'Mật khẩu không chính xác' });
                return;
            }
        
            const accessToken = jwt.sign(
                { id: user.id, roleId: user.roleId },
                JWT_SECRET,
                { expiresIn: '1h' } // Access token hết hạn sau 45 phút
            );
            const refreshToken = jwt.sign(
                { id: user.id,roleId: user.roleId },
                REFRESH_TOKEN_SECRET,
            );
            const { password:passUser,hashedPassword, createdAt, updatedAt, ...safeUser } = user.toJSON();

            res.json({ accessToken, refreshToken, user:safeUser});
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error });
        }
    }
    public static async refreshToken(req: Request, res: Response): Promise<void> {
        try{
            const { refreshToken } = req.body;

            if (!refreshToken) {
                res.status(403).json({ message: 'Refresh token không hợp lệ' });
            }
            const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { id: number;roleId:number };
            // Tạo access token mới
            // const newAccessToken = jwt.sign(
            //     { id: userId },
            //     JWT_SECRET,
            //     { expiresIn: '10h' } // Access token mới hết hạn sau 15 phút
            // );
            const newAccessToken = jwt.sign({ 
                id: payload.id,roleId:payload.roleId }, 
                JWT_SECRET, {
                expiresIn: '1h',
            });
            res.status(201).json({ accessToken: newAccessToken });
        }catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            res.status(500).json({
                message: 'Error creating shift',
                error: errorMessage,
            });
        }
        
    }
    public static async logout(req: Request, res: Response){
        const { refreshToken } = req.body;
        if (refreshToken && refreshTokens[refreshToken]) {
            delete refreshTokens[refreshToken]; // Xóa refresh token khỏi bộ nhớ
        }
        return res.status(200).json({ message: 'Đăng xuất thành công' });
    }
    // Lấy thông tin người dùng theo ID
    public static async getUserById(req: Request, res: Response): Promise<void> {
        try {
        const { id } = req.params;
        const user = await User.findByPk(id,{attributes:{exclude:['password, hashedPassword']}});

        if (!user) {
            res.status(404).json({ message: 'Người dùng không tồn tại' });
            return;
        }

        res.status(200).json(user);
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy thông tin người dùng' });
        }
    }
    public static async getUserByPhone(req: Request, res: Response): Promise<void> {
        try {
        const { phone } = req.body;
        const user = await User.findOne({
            where:{phone:phone},
            attributes:{exclude:['password, hashedPassword']}
        });

        if (!user) {
            const newUser = await (new User).createCustomer(phone)
            res.status(200).json({data:newUser, message:'Chưa có khách hàng'});
            return;
        }

        res.status(200).json({data:user, message:'Lấy khách hàng thành công'});
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy thông tin người dùng' });
        }
    }
    // Cập nhật thông tin người dùng
    public static async updateUser(req: Request, res: Response): Promise<void> {
        try {
        const { id } = req.params;
        const { username, phone, roleId } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            res.status(404).json({ message: 'Người dùng không tồn tại' });
            return;
        }

        // Cập nhật thông tin người dùng
        await user.update({
            username: username || user.username,
            phone: phone || user.phone,
            roleId: roleId || user.roleId,
        });

        res.status(200).json({ message: 'Cập nhật thông tin người dùng thành công', user });
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật thông tin người dùng' });
        }
    }

    // Xóa người dùng
    public static async deleteUser(req: Request, res: Response): Promise<void> {
        try {
        const { id } = req.params;

        const user = await User.findByPk(id);

        if (!user) {
            res.status(404).json({ message: 'Người dùng không tồn tại' });
            return;
        }

        // Xóa người dùng
        await user.destroy();

        res.status(200).json({ message: 'Xóa người dùng thành công' });
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa người dùng' });
        }
    }
    // điểm
    public static async getAllCustomer(req: Request, res: Response): Promise<void> {
        try {
        // Lấy các tham số từ query
        const { page = 1, limit = 20, name, status, dateFrom, dateTo,categoryId, phone } = req.query;
        // Chuyển đổi `page` và `limit` sang số nguyên
        const pageNumber = parseInt(page as string, 10) || 1;
        const limitNumber = parseInt(limit as string, 10) || 20;
        // Tính toán offset
        const offset = (pageNumber - 1) * limitNumber;

        const where:any = {};
        where.roleId = ROLE_CUSTOMER
        if (name) {
            where.name = { [Op.like]: `%${name}%` }; // Tìm kiếm theo tên (LIKE '%name%')
        }
        if (phone) {
            where.phone = phone; // Tìm kiếm theo tên (LIKE '%name%')
        }
        if (status) {
            where.status = status; // Tìm kiếm theo trạng thái
        }
        if (categoryId) {
            where.categoryId = categoryId; // Tìm kiếm theo trạng thái
        }
        if (dateFrom || dateTo) {
            where.createdAt = {
            ...(dateFrom && { [Op.gte]: dateFrom }), // Ngày bắt đầu
            ...(dateTo && { [Op.lte]: addDay(dateTo as string,1)  }), // Ngày kết thúc
            };
        }
        // Truy vấn cơ sở dữ liệu với phân trang và điều kiện tìm kiếm
        const { rows: users, count: total } = await User.findAndCountAll({
            where,
            limit: limitNumber,
            offset,
            attributes:['phone', 'point', 'name','createdAt', 'status','id'],
        });
        // Tính tổng số trang
        const totalPages = Math.ceil(total / limitNumber);
        const data = {
        data: users,
        pagination: {
            total: total,
            totalPages: totalPages,
            currentPage: pageNumber,
            limit: limitNumber,
        },
        }
        res.status(200).json({ message: 'Lấy dữ liệu thành công', data: users,
            pagination: {
                total: total,
                totalPages: totalPages,
                currentPage: pageNumber,
                limit: limitNumber,
            }, });
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa người dùng' });
        }
    }
    public static async searchCustomer(req: Request, res: Response): Promise<void> {
        try {
            const { name,roleId } = req.query;
    
            if (!name) {
                res.status(400).json({ message: 'Vui lòng cung cấp tên để tìm kiếm' });
                return;
            }
    
            const customers = await User.findAll({
                where: {
                    [Op.or]: [
                        {
                            name: {
                                [Op.like]: `%${name}%`
                            }
                        },
                        {
                            phone: {
                                [Op.like]: `%${name}%`
                            }
                        }
                    ],
                    roleId:roleId
                },
                limit: 10
            });
            const aData = customers.map(item=>{
                return {id:item.id, name:item.name, label: `${item.name} - ${item.phone}`}
            })
            res.status(200).json(aData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Đã xảy ra lỗi khi tìm kiếm người dùng' });
        }
    }
    public static async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const {passwordNew} = req.body;
            const user = req.user
            if (!user) {
                res.status(400).json({ message: 'Người dùng không tồn tại' });
                return;
            }
            const hashedPassword = await bcrypt.hash(passwordNew, 10);
            user.password = hashedPassword;
            await user.save();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Đã xảy ra lỗi khi tìm kiếm người dùng' });
        }
    }
}
export default UserController