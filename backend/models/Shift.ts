import { DataTypes, Model, Op } from 'sequelize';
import sequelize from '../database/db';
import User from './User';
import redisClient from '../redisClient';
import { SENCOND_DAY } from '../BidaConst';
  // Định nghĩa các loại ca làm việc
export enum SHIFT_TYPES {
    MORNING= 1,
    AFTERNOON= 2,
    NIGHT= 3,
};
export const SHIFT_LABELS: Record<SHIFT_TYPES, string> = {
    [SHIFT_TYPES.MORNING]: 'Ca sáng',
    [SHIFT_TYPES.AFTERNOON]: 'Ca chiều',
    [SHIFT_TYPES.NIGHT]: 'Ca tối',
  };
class Shift extends Model {
  public id!: number;
  public name!: string;
  public startTime!: string; // format: "HH:mm:ss"
  public endTime!: string;   // format: "HH:mm:ss"
  public description!: string;
  public status!:number;
  public numEmployee!:number;
  public salaryHour!:number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public async getAllShift(){
    const cacheKey = 'shifts'
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return parsedData;
    }
    const shifts = await Shift.findAll({});
    // Lưu kết quả vào cache
    await redisClient.set(cacheKey, JSON.stringify(shifts), 'EX', SENCOND_DAY); // Cache trong 1 giờ
    return shifts;
  }
  public async deleteCache(){
    const keys = await redisClient.keys('shifts');
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  }
}

Shift.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    numEmployee: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    salaryHour:{
      type: DataTypes.INTEGER,
    }
  },
  {
    sequelize,
    modelName: 'Shift',
    timestamps: true,
    underscored: true,
  },
);

export default Shift;