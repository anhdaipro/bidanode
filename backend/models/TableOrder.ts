import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/db';
import TableSession from './TableSession'; // phiên chơi bàn
import Product from './Product'; // sản phẩm như mì, nước ngọt, thuốc lá...
import dayjs from 'dayjs';

class TableOrderDetail extends Model {
  public id!: number;
  public sessionId!: number;
  public productId!: number;
  public categoryId!: number;
  public quantity!: number;
  public price!: number; // đơn giá tại thời điểm đặt
  public totalPrice!: number; // đơn giá tại thời điểm đặt
  public uidLogin!: number;
  public createdAtBigint!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TableOrderDetail.init(
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
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    categoryId:{
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAtBigint: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'TableOrder',
    tableName: 'table_order_detail',
    underscored: true,
    timestamps: true,
  }
);
TableOrderDetail.beforeCreate((tableOrderDetail) => {
  tableOrderDetail.createdAtBigint = dayjs(tableOrderDetail.createdAt).unix(); // Lưu thời gian tạo phiên làm việc
})
export default TableOrderDetail;
