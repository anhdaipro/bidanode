import { DataTypes, Model, Op } from 'sequelize';
import sequelize from '../database/db';
import User from './User';
import dayjs from 'dayjs';
import { ROLE_EMPLOYEE } from '../BidaConst';
import Shift from './Shift';
import isoWeek from 'dayjs/plugin/isoWeek';
import TimeSheet from './TimeSheet';
dayjs.extend(isoWeek);
class EmployeeProblem extends Model {
  public id!: number;
  public employeeId!: number;
  public belongId!:number;
  public type!: number;
  public status!: number;
  public message!: string;
  public createdBy!: string;
  public createdAtBigint!: number;
  public phone!: string;
  public roleId!: number;
  public money!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  
}

EmployeeProblem.init(
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
    belongId: {
        type: DataTypes.INTEGER,
    },
    status: {
        type: DataTypes.TINYINT,
        allowNull: false,
    },
    createdAtBigint: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    roleId: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
    },
    money: {
        type: DataTypes.INTEGER,
      },
    phone: {
      type: DataTypes.STRING,
    },
    message: {
        type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: 'EmployeeProblem',
    tableName: 'employee_problems',
    timestamps: true,
    underscored: true,
  },
);
EmployeeProblem.belongsTo(User, { foreignKey: 'employeeId', as: 'rEmployee' });
EmployeeProblem.beforeCreate((schedule) => {
  schedule.createdAtBigint = dayjs().unix();
})
export default EmployeeProblem;