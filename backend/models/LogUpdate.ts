import { Model, DataTypes } from 'sequelize';
import sequelize from '../database/db';
import dayjs from 'dayjs';
export const TYPE_PRODUCT = 1;
export const TYPE_TRANSACTION = 2;
export const TYPE_TABLE = 3;
export const TYPE_SESSION = 4;
class LogUpdate extends Model {
  public id!: number;
  public belongId!: number;//bàn thanh toán
  public type!: number;//tổng tiền
  public roleId?: number;
  public userId?:number;
  public changes?:string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LogUpdate.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.INTEGER, allowNull: false },
    roleId: { type: DataTypes.INTEGER, allowNull: false },
    belongId: { type: DataTypes.INTEGER, allowNull: false },
    changes: { type: DataTypes.JSON },
  },
  {
    sequelize,
    modelName: 'LogUpdate',
    tableName: 'log_update',
    timestamps: true,
    underscored: true,
  }
);

export default LogUpdate;
