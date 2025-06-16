import { Model,DataTypes } from "sequelize";
import sequelize from '../database/db';
class PaymentPeriod extends Model{
    public id!: number; // ID của kỳ thanh toán
    public period_type!: string; // Loại kỳ thanh toán (weekly, mid_month, end_month)
    public start_date!: Date; // Ngày bắt đầu kỳ thanh toán
    public end_date!: Date; // Ngày kết thúc kỳ thanh toán
    public payment_date!: Date; // Ngày thanh toán
    public status!: string; // Trạng thái (pending, processed, paid)
    public readonly createdAt!: Date; // Thời gian tạo bản ghi
    public readonly updatedAt!: Date; // Thời gian cập nhật bản ghi

}


PaymentPeriod.init ({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    period_type: {type:DataTypes.STRING}, // weekly, mid_month, end_month
    start_date: {type:DataTypes.DATEONLY},
    end_date: {type:DataTypes.DATEONLY},
    payment_date: {type:DataTypes.DATEONLY},
    status: {type:DataTypes.STRING}, // pending, processed, paid
    }, 
    { sequelize,
        tableName: 'payment_periods', 
        timestamps: true ,
        underscored: true,
    }
);