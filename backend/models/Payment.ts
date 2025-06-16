import { Model, DataTypes,Op } from 'sequelize';
import sequelize from '../database/db';
import dayjs from 'dayjs';
class Payment extends Model {
  public id!: number;
  public sessionId!: number;//bàn thanh toán
  public totalAmount!: number;//tổng tiền
  public cashAmount!: number;//tiền mặt
  public onlineAmount!: number;//tiền chuyển khaonr
  public method!: number;//loại thanh toán
  public paidAt!: Date;//thanh toán lúc
  public paidAtBigint!: number;//thanh toán lúc
  public note?: string;//ghi chú
  public employeeId?:string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public async countInvoice(){
    const today = dayjs();
    const todayStr = today.format('YYYY-MM-DD'); // "2025-05-24"
    const todayBigint = dayjs(todayStr).unix();      // UNIX timestamp (giây)
    return await Payment.count({
      where:{
          paitAtBigint: {
              [Op.gte] : todayBigint
          }
      }
  })
  }
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    cashAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    onlineAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    method: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    paidAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    paidAtBigint: {
      type: DataTypes.BIGINT,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    employeeId:{
      type:DataTypes.INTEGER,
      
    }
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payment',
    timestamps: true,
    underscored: true,
  }
);
Payment.beforeCreate((payment) => {
  payment.paidAtBigint = dayjs(payment.paidAt).unix();
})
export default Payment;
