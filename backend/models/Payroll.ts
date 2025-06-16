import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/db';
import Schedule from './Schedule';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
class Payroll extends Model {
    public id!: number; // ID của bản ghi
    public employeeId!: number; // ID của nhân viên
    public periodType!: number; // Tháng tính lương
    public periodStart!: string; // Năm tính lương
    public periodEnd!: string; // Tổng số giờ làm việc
    public baseHours!:number;
    public baseSalary!: number; // Lương cơ bản
    public overtimeHours!: number; // Số giờ làm thêm
    public overtimePay!: number; // Tiền làm thêm giờ
    public penalty!: number; // Các khoản khấu trừ
    public totalSalary!: number; // Tiền thưởng
    public status!: number; // Tổng lương thực nhận
    public paymentDate?: string; // Ghi chú bổ sung (có thể null)
    public note!: string; //
    public readonly createdAt!: Date; // Thời gian tạo bản ghi
    public readonly updatedAt!: Date; // Thời gian cập nhật bản ghi
    
}

Payroll.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  employeeId:{
    type: DataTypes.INTEGER,
  },
  periodType: {
    type: DataTypes.TINYINT,
    allowNull: false,
  },
  periodStart: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  periodEnd: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  baseHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  baseSalary: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  overtimeHours: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  penalty:{
    type: DataTypes.INTEGER,
  },
  overtimePay: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },

  totalSalary: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.TINYINT,
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
  },
  note: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Payroll',
  tableName: 'payroll',
  timestamps: true,
  underscored: true,
});

export default Payroll;