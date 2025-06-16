import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/db';

class Reward extends Model {
  public id!: number;
  public phone!: string;      // Số điện thoại
  public bonusMinutes!: number;      // Tổng số giờ khuyến mãi
  public sessionId!: number;
  public point!:number;
  public uidLogin!: number;
  public customerId!: number;
  public readonly createdAt!: Date;//db
  public readonly updatedAt!: Date;//db
  // Virtual: Tính số giờ còn lại
  public remainingBonusHours() {
    return this.bonusMinutes;
  }
}

Reward.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    bonusMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    point: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    uidLogin: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    customerId: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    sessionId: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Reward',
    tableName: 'reward',
    timestamps: true,
    underscored: true,
  },
);

export default Reward;
