
import { Request, Response } from 'express';
import User from '../models/User';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { STATUS_ACTIVE } from '../BidaConst';
import { addDay, generateUsername, slugify } from '../Format';
import UserProfile from '../models/UserProfile';
import { folder } from '../routes/employeeRoute';
import { ROLES_EMPLOYEE } from '@form/user';
class EmployeeController {
    
    public static async createEmployee(req: Request, res: Response): Promise<void> {
        try {
            const {phone,email, roleId, address, name, 
                baseSalary,dateOfBirth,
                position,bankNo,bankId,bankFullname,dateLeave,dateBeginJob,
                shiftId,
                avatar,
                cccdFront,
                cccdBack,
                publicAvatar,
                publicCccdFront,
                publicCccdBack,
                status,
                note } = req.body;
            // Kiểm tra xem username hoặc phone đã tồn tại chưa
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: [{ phone }],
                    roleId:{[Op.in]: ROLES_EMPLOYEE},
                },
            });
            if (existingUser) {
                res.status(400).json({ message: 'Tên người dùng hoặc số điện thoại đã tồn tại' });
                return;
            }
            let username = generateUsername(name);
            let counter = 1;
            const password = '123123'
            while (await User.findOne({ where: { username } })) {
                username = `${username}${counter}`;
                counter++;
            }
            // Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);
            // Tạo người dùng mới
            const newUser = new User;
            const profile = new UserProfile;
            Object.assign(profile, {
                phone,
                name,
                dateOfBirth,
                baseSalary,
                avatar,
                publicAvatar,
                publicCccdFront,
                publicCccdBack,

                cccdFront,
                cccdBack,
                position,
                bankNo,
                bankId,
                bankFullname,
                dateLeave,
                dateBeginJob,
                note,
            });
            Object.assign(newUser, {
                phone,
                name,
                email,
                password,
                baseSalary,
                username,
                dateOfBirth,
                hashedPassword,
                roleId,
                address,
                status,
                shiftId,
            });
            await newUser.save();
            profile.userId = newUser.id;
            await profile.save();
            res.status(201).json({ message: 'Người dùng đã được tạo thành công', user: newUser });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo người dùng' });
        }
    }
   
    // Cập nhật thông tin
    public static async updateEmployee(req: Request, res: Response): Promise<void> {
        try {
        const { id } = req.params;
        const { phone, roleId, address, name, 
            baseSalary,dateOfBirth,position,
            bankNo,bankId,bankFullname,
            dateLeave, 
            shiftId,
            status,
            avatar,
            cccdFront,
            cccdBack,
            publicAvatar,
            publicCccdFront,
            publicCccdBack,
            dateBeginJob, note } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            res.status(404).json({ message: 'Người dùng không tồn tại' });
            return;
        }
        const existingUser = await User.findOne({
            where: {
                phone: phone,
                roleId:{[Op.in]: ROLES_EMPLOYEE},
                id: {
                [Op.ne]: id
                }
            }
            
        });

        if (existingUser) {
            res.status(400).json({ message: 'Số điện thoại đã tồn tại' });
            return;
        }
        // Cập nhật thông tin người dùng
        await user.update({
            phone,
            roleId,
            address,
            name,
            baseSalary,
            dateOfBirth,
            status,
            shiftId,
        });
        const userProfile = await UserProfile.findOne({
            where: {
                userId: id,
            },
        });
        if(!userProfile) {
            res.status(404).json({ message: 'Thông tin người dùng không tồn tại' });
            return;
        }
       
        Object.assign(userProfile, {
            phone,
            name,
            dateOfBirth,
            baseSalary,
            position,
            bankNo,
            bankId,
            bankFullname,
            dateLeave,
            dateBeginJob,
            publicCccdFront,
            publicCccdBack,
            publicAvatar,
            note,
            ...(cccdFront && {cccdFront}),
            ...(cccdBack && {cccdBack}),
            ...(avatar && {avatar}),
        });
        await userProfile.deleteFile()
        await userProfile.save();
        res.status(200).json({ message: 'Cập nhật thông tin người dùng thành công', user });
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật thông tin người dùng' });
        }
    }
    public static async getAllEmployee(req: Request, res: Response): Promise<void> {
        try {
        // Lấy các tham số từ query
        const { page = 1, limit = 20, name, status, dateFrom, dateTo,categoryId, phone,position,date_of_birth } = req.query;
        // Chuyển đổi `page` và `limit` sang số nguyên
        const pageNumber = parseInt(page as string, 10) || 1;
        const limitNumber = parseInt(limit as string, 10) || 20;
        // Tính toán offset
        const offset = (pageNumber - 1) * limitNumber;

        const where:any = {};
        where.roleId = { [Op.in]: ROLES_EMPLOYEE }; // Chỉ lấy nhân viên
        if (name) {
            where.name = { [Op.like]: `%${name}%` }; // Tìm kiếm theo tên (LIKE '%name%')
        }
        if (phone) {
            where.phone = phone; // Tìm kiếm theo tên (LIKE '%name%')
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
        const userProfileWhere: any = {};
        if (position) {
            userProfileWhere.position = Number(position);
          }
        if (date_of_birth) {
            userProfileWhere.date_of_birth = date_of_birth;
        }
        const include: any[] = [];

        include.push({
        model: UserProfile,
        as: 'rProfile',
        // attributes:['baseSalary'],
        required: Object.keys(userProfileWhere).length > 0, // required = true nếu có điều kiện
        ...(Object.keys(userProfileWhere).length > 0 && { where: userProfileWhere }),
        });
        // Truy vấn cơ sở dữ liệu với phân trang và điều kiện tìm kiếm
        const { rows: users, count: total } = await User.findAndCountAll({
            where,
            limit: limitNumber,
            include,
            offset,
            attributes:['phone', 'name','createdAt', 'status','id', 'createdAt', 'address', 'roleId'],
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
    public static getEmployeeById = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        try {
            const user = await User.findByPk(id, {
                include: [{
                    model: UserProfile,
                    as: 'rProfile',
                }],
            }) as User & { rProfile?: UserProfile };
            if (!user) {
                res.status(404).json({ message: 'Người dùng không tồn tại' });
                return;
            }
            const userData = user.toJSON();
            const {id:profileId,createdAt, ...rest} = userData.rProfile || {};
            const data = Object.assign(userData, { ...rest });
            res.status(200).json({ message: 'Lấy thông tin người dùng thành công', data:data });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy thông tin người dùng' });
        }
    }
    public static getEmployeeSchedule = async (req: Request, res: Response): Promise<void> => {
        try {
            const aEmployee = await User.findAll({
                where: {
                    roleId:{[Op.in]: ROLES_EMPLOYEE},
                    status:STATUS_ACTIVE,
                },
               attributes:['id', 'name', 'phone', 'email', 'roleId',],
            })
            res.status(200).json({ message: 'Lấy thông tin người dùng thành công', data:aEmployee });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy thông tin người dùng' });
        }
    }
}
export default EmployeeController