import { Model, DataTypes } from 'sequelize';
import sequelize from '../database/db';
class LoginHistory extends Model {
    public id!: number;
    public userId!: number;//bàn thanh toán
    public device!: number;//tổng tiền chưa giảm giá
    public browserVersion!: number;//tổng tiền
    public browser!: number;//tiền mặt
    public os!: number;//tiền chuyển khaonr
    public createdAt!:Date
}
LoginHistory.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    device: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    browser: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    browserVersion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    os: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'login_histories',
    sequelize, // your sequelize instance
  });