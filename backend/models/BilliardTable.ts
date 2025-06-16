import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/db';
import { STATUS_PLAYING } from '@form/billiardTable';
class BilliardTable extends Model {
  public id!: number;
  public tableNumber!: number;
  public status!: number;
  public hourlyRate!: number;
  public type!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public async countTable(){
    return await BilliardTable.count();
  }
  public async countTablePlaying(){
    const aTable = await BilliardTable.findAll({
      where:{
        status:STATUS_PLAYING
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'uidLogin']
      }
    });
  }
}

BilliardTable.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tableNumber: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    hourlyRate: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'BilliardTable',
    tableName: 'billiard_table',
    underscored: true,
    timestamps: true, // Tự động thêm createdAt và updatedAt
  },
);

export default BilliardTable;