import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/db';
import User from './User';
import Shift from './Shift';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import Schedule from './Schedule';
export const TYPE_CHECKIN = 1;
export const TYPE_CHECKOUT = 2;
class TimeSheet extends Model {
  public id!: number;
  public employeeId!: number;
  public scheduleId!: number;
  public shiftId!: number; // ID của ca làm việc
  public checkInTime!: string;
  public checkOutTime!: string;
  public location!: string;
  public date!: string;
  public dateBigint!: number;
  public createdAtBigint!: number;
  public lateMinutes!: number; // Số phút đi muộn
  public earlyMinutes!: number; // Số phút về sớm
  public overtimeHours!: number; // Số phút làm thêm giờ
  public actualHours!: number; // Số giờ làm việc thực tế
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public type!: number;
  public rShift!:Shift;
  public rSchedule!:Schedule
  
  public async getByType() {
    let existingTimeSheet;
    if(this.type === TYPE_CHECKIN) {
      const today = dayjs().format('YYYY-MM-DD');
      existingTimeSheet = await TimeSheet.findOne({
        where: {
          employeeId: this.employeeId,
          date: today,
          checkInTime: { [Op.ne]: null }, // Đã check-in
          // checkOutTime: null, // Chưa check-out
        },
      });
    }else{
      existingTimeSheet = await TimeSheet.findOne({
        where: {
          employeeId: this.employeeId,
          checkInTime: { [Op.ne]: null }, // Đã check-in
          checkOutTime: null, // Chưa check-out
        },
      });

    }
    return existingTimeSheet;
  };
  public updateStatusAfterCheckout(){
    
  }
}

TimeSheet.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      
    },
    lateMinutes:{
      type: DataTypes.INTEGER,
    },
    earlyMinutes:{
      type: DataTypes.INTEGER,
    },
    overtimeHours:{
      type: DataTypes.INTEGER,
    },
    actualHours:{
      type: DataTypes.INTEGER,
    },
    scheduleId:{
      type: DataTypes.INTEGER,
    },
    shiftId:{
      type: DataTypes.INTEGER,
    },
    checkInTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    checkOutTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dateBigint: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    createdAtBigint: {
      type: DataTypes.BIGINT,
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'TimeSheet',
    tableName: 'time_sheet',
    timestamps: true,
    underscored: true,
  }
);
TimeSheet.belongsTo(User, { foreignKey: 'employeeId', as: 'rEmployee' });
TimeSheet.beforeCreate((timeSheet, options) => {
  timeSheet.date = dayjs().format('YYYY-MM-DD');
  timeSheet.createdAtBigint = dayjs().unix();
  timeSheet.dateBigint = dayjs(timeSheet.date).unix();
})
export default TimeSheet;
