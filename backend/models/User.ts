import { DataTypes, Model,ValidationError, ValidationErrorItem } from 'sequelize';
import sequelize from '../database/db';
import bcrypt from 'bcrypt'
import UserProfile from './UserProfile';
import dayjs from 'dayjs';
const ROLE_ADMIN = 1
const ROLE_EMPLOYEE = 2
const ROLE_CUSTOMER = 3
export const ROLE = [
  ROLE_ADMIN,
  ROLE_EMPLOYEE,
  ROLE_CUSTOMER,
]
const STATUS_ACTIVE = 1
const STATUS_INACTIVE = 0
export const LSTATUS = [
  STATUS_ACTIVE,
  STATUS_INACTIVE,
]
export const ROLE_LABELS: Record<number, string> = {
  [ROLE_ADMIN]: 'Quản trị viên',
  [ROLE_EMPLOYEE]: 'Nhân viên',
  [ROLE_CUSTOMER]: 'Khách hàng',
};
class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public username!: string;
  public roleId!: number;//tài khoản
  public password!: string;
  public hashedPassword!: string;
  public phone!: string;//số điện thoại
  public status!: number;
  public address!: string;
  public point!: number;
  public shiftId!: number;
  public dateOfBirth!:Date;
  public salaryType!: number; // Loại lương (theo giờ, theo tháng, theo sản phẩm)
  public  createdAtBigint!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public async getUserByRole(roleId:number|string){
    const users = await User.findAll({
      where:{
        roleId:roleId
      }
    })
    const aId = users.map(item=>item.id)
    return aId
  }
  public async createCustomer(phone:string){
    const username = phone
    const password = '123123'
    const roleId = ROLE_CUSTOMER;
    const status = STATUS_ACTIVE
    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    // Tạo người dùng mới
    const newUser = await User.create({
        username,
        phone,
        status,
        password: hashedPassword,
        roleId,
    });
    return newUser
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status:{
      type:DataTypes.TINYINT,
    },
    roleId: {
        type: DataTypes.TINYINT,
        allowNull: false,
    },
    shiftId: {
      type: DataTypes.TINYINT,
    },
    createdAtBigint: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    point: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    salaryType:{
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hashedPassword: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address:{
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName:'users',
    timestamps: true, // Tự động thêm createdAt và updatedAt
    underscored: true,
    // defaultScope: {
    //   attributes: { exclude: ['password'] }, // Loại bỏ password khi trả về dữ liệu
    // },
  }
);
User.afterValidate(async (transaction, options) =>{

})
User.beforeCreate(async (user, options) => {
  user.createdAtBigint = dayjs(user.createdAt).unix(); // Lưu thời gian tạo người dùng
});
User.hasOne(UserProfile,{
  foreignKey:'userId',
  as:'rProfile'
})
User.beforeValidate(async (user, options) => {
  if(user.roleId == ROLE_CUSTOMER){
    user.status = STATUS_ACTIVE
    user.username = user.phone
  }
});
export default User;