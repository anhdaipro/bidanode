import { Model, DataTypes } from 'sequelize';
import sequelize from '../database/db';
import User from './User';
import Schedule from './Schedule';
class Overtime extends Model {
    public id!: number;
    public employeeId!: number;
    public scheduleId!: number; // nếu OT gắn với ca làm chính
    public fromTime!: Date;
    public toTime!: Date;
    public reason!: string;
    public approvedBy!: number; // người duyệt OT
    public isApproved!: boolean; // duyệt OT hay chưa
    public createdAt!: Date;
    public updatedAt!: Date;
}
Overtime.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      employeeId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      scheduleId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      fromTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      toTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: '',
      },
      approvedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      isApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
        sequelize,
        tableName: 'overtimes',
        modelName: 'Overtime',
        underscored: true,
        timestamps: true,
    }
  );
 
Overtime.belongsTo(User, { foreignKey: 'employeeId' , as: 'rEmployee' });
Overtime.belongsTo(Schedule, { foreignKey: 'scheduleId' , as: 'rSchedule' });