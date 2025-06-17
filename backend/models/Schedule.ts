import { DataTypes, Model, Op,fn,col } from 'sequelize';
import sequelize from '../database/db';
import User from './User';
import dayjs from 'dayjs';
import { ROLE_EMPLOYEE } from '../BidaConst';
import Shift from './Shift';
import isoWeek from 'dayjs/plugin/isoWeek';
import { POSITION_LABELS, ROLES_EMPLOYEE } from '@form/user';
import TimeSheet from './TimeSheet';
import EmployeeProblem from './EmployeeProblem';
import { ScheduleStatus } from '@form/schedule';
import Payroll from './Payroll';
import { TYPE_WEEKLY } from '@form/payroll';
import { SHIFT_TYPES } from '@form/shifth';
dayjs.extend(isoWeek);
class Schedule extends Model {
  public id!: number;
  public employeeId!: number;
  public shiftId!:number;
  public workDate!: string;
  public status!: number;
  public startTime!: string;
  public endTime!: string;
  public createdBy!:number;
  public salaryHour!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public createdAtBigint!: number;
  public workDateBigint!: number;
  // public async calculateSalary(employeeId: number, startDate: Date, endDate: Date): Promise<number> {
  //   try {
  //       // Bảng ánh xạ mức lương theo ca
  //       const shiftSalaryRates: { [key: number]: number } = {
  //           1: 100000, // Lương ca 1 (ví dụ: 100,000 VND/giờ)
  //           2: 120000, // Lương ca 2
  //           3: 150000, // Lương ca 3
  //       };
    
  //       // Lấy dữ liệu từ bảng Schedule
  //       const schedules = await Schedule.findAll({
  //           where: {
  //           employeeId,
  //           workDate: {
  //               [Op.between]: [startDate, endDate],
  //           },
  //           status: 1, // Chỉ tính lương cho các ngày làm việc hợp lệ
  //           },
  //       });
    
  //       let totalSalary = 0;
    
  //       // Tính lương cho từng bản ghi
  //       for (const schedule of schedules) {
  //           const { checkIn, checkOut, shiftId } = schedule;
    
  //           if (checkIn && checkOut) {
  //           // Tính số giờ làm việc
  //           const hoursWorked = Math.abs(new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60);
    
  //           // Lấy mức lương theo ca
  //           const hourlyRate = shiftSalaryRates[shiftId] || 0;
    
  //           // Tính lương cho bản ghi này
  //           totalSalary += hoursWorked * hourlyRate;
  //           }
  //       }
    
  //       return totalSalary;
  //       } catch (error) {
  //       console.error('Error calculating salary:', error);
  //       throw new Error('Không thể tính lương');
  //       }
  // }
  public async cronGenerateWeeklySchedule(){
    try{
      const today = dayjs('2025-05-20');
      const startOfNextWeek = today.add(1, 'week').startOf('isoWeek'); // Thứ 2
      const endOfNextWeek = startOfNextWeek.add(6, 'day');
      await Schedule.destroy({
        where: {
          workDate: {
            [Op.between]: [
              startOfNextWeek.format('YYYY-MM-DD'),
              endOfNextWeek.format('YYYY-MM-DD'),
            ],
          },
        },
      });
      const shifts = await Shift.findAll({
        where: {
          status: 1, // Chỉ lấy các ca làm việc đang hoạt động
        },
        attributes: ['id', 'startTime', 'endTime', 'salaryHour'],
      });
      const aEmployee = await User.findAll({
        where: {
          roleId: {[Op.in]: ROLES_EMPLOYEE}, // Lấy tất cả nhân viên
          shiftId: {[Op.gt]: 0}, // Lấy tất cả ca làm việc
        },
        attributes:['id','shiftId', 'roleId']
      });
      const aInsert = [];
      for (const mEmployee of aEmployee) {
        for (let i = 0; i < 6; i++) {
          const workDate = dayjs(startOfNextWeek).add(i, 'day').format('YYYY-MM-DD');
          const shift = shifts.find(s => s.id == mEmployee.shiftId);
          if(!shift){
            continue;
          }
          aInsert.push({
              employeeId: mEmployee.id,
              shiftId: mEmployee.shiftId,
              startTime: shift.startTime,
              endTime: shift.endTime,
              workDate: workDate,
              createdAtBigint:dayjs().unix(),
              workDateBigint:dayjs(workDate).unix(),
              status:ScheduleStatus.NEW,
              salaryHour:shift.salaryHour,
              note:'',
          });
          // await Schedule.create({
          //   employeeId: mEmployee.id,
          //   shiftId: mEmployee.shiftId,
          //   startTime: shift?.startTime,
          //   endTime: shift?.endTime,
          //   workDate,
          // });
        }
      }
      console.log(aInsert)
      await Schedule.bulkCreate(aInsert, {});
    } catch (error) {
      console.error('Error in cronGenerateWeeklySchedule:', error);
    } 
  }
  public async cronCalSalary(today: string = dayjs().format('YYYY-MM-DD')){
    const targetDate = dayjs().subtract(1, 'week').startOf('day');
    const strDate = targetDate.format('YYYY-MM-DD');
    const startOfLastWeek = dayjs(today).subtract(1, 'week').startOf('isoWeek');
    const endOfLastWeek = dayjs(today).subtract(1, 'week').endOf('isoWeek');
    const shifts = await Shift.findAll({
      // where: {
      //   status: 1, // Chỉ lấy các ca làm việc đang hoạt động
      // },
      attributes: ['id', 'startTime', 'endTime'],
    });
    const timeSheets = await TimeSheet.findAll({
      where: {
        date: {
          [Op.gte]: startOfLastWeek.format('YYYY-MM-DD'),
          [Op.lt]: endOfLastWeek.format('YYYY-MM-DD'),
        },
      },
      attributes: [
        [fn('SUM', col('actual_hours')), 'actualHours'],
        [fn('SUM', col('overtime_hours')), 'overtimeHours'],
    ],
      group:['employeeId']
    });
    const salaryRecords: any[] = [];
    const aEmployeeProblem = await EmployeeProblem.findAll({
      where:{
        status:0,
        createdAt: {
          [Op.gte]: startOfLastWeek.format('YYYY-MM-DD'),
          [Op.lt]: endOfLastWeek.format('YYYY-MM-DD'),
        },
      },
      attributes: [
        [fn('SUM', col('money')), 'money'],
      ],
      group:['employeeId']
    })
    await Payroll.destroy({
      where: {
        periodStart: startOfLastWeek.format('YYYY-MM-DD'),
        periodEnd: endOfLastWeek.format('YYYY-MM-DD'),
        periodType: TYPE_WEEKLY,
      },
    });
    for(const timeSheet of timeSheets){
      const {employeeId, actualHours,overtimeHours,shiftId} = timeSheet
      const shift = shifts.find(s => s.id == shiftId);
      if(!shift) {
        continue;
      }
      const {salaryHour} = shift
      const baseSalary = actualHours * salaryHour;
      const employeeProblem = aEmployeeProblem.find(item=>item.employeeId == employeeId)
      let penalty = employeeProblem ? employeeProblem.money : 0
      const totalSalary = Math.max(0, penalty)
      salaryRecords.push({
        employeeId,
        baseSalary,
        penalty,
        totalSalary,
        overtimeHours,
        periodStart: startOfLastWeek.format('YYYY-MM-DD'),
        periodEnd: endOfLastWeek.format('YYYY-MM-DD'),
        periodType: TYPE_WEEKLY,
        baseHours: actualHours,
        createdAt: dayjs(),
        paymentDate:dayjs().format('YYYY-MM-DD'),
        note:'Tổng lương theo ca tuần'
      })
    }
    if(salaryRecords.length >0){
      await Payroll.bulkCreate(salaryRecords, {
       
      });
    }
  }
  public async updateStatusAndSalary(today: string = dayjs().format('YYYY-MM-DD')) {
    try{
      const targetDate = dayjs().subtract(1, 'day');
      const strDate = targetDate.format('YYYY-MM-DD');
      const startOfLastWeek = dayjs(today).subtract(1, 'week').startOf('isoWeek');
      const endOfLastWeek = dayjs(today).subtract(1, 'week').endOf('isoWeek');
      console.log(startOfLastWeek.format('YYYY-MM-DD'))
      const timeSheets = await TimeSheet.findAll({
        where: {
          date: strDate
        },
      });
      const updatedSchedules: any[] = [];
      const aInsertProblem = [];
      const aUpdateTimeSheet = [];
      const shifts = await Shift.findAll({
        where: {
          status: 1, // Chỉ lấy các ca làm việc đang hoạt động
        },
        attributes: ['id', 'startTime', 'endTime'],
      });
      const schedules = await Schedule.findAll({
        where: {
          workDate: strDate,
          status:{[Op.ne]: ScheduleStatus.LEAVE},
          shiftId:{[Op.in]: [SHIFT_TYPES.MORNING, SHIFT_TYPES.AFTERNOON,SHIFT_TYPES.NIGHT]}, // Chỉ lấy ca ngày và ca đêm
        },
      });
      console.log(schedules.length)
      await EmployeeProblem.destroy({
        where: {
          belongId: {[Op.in]: schedules.map(s => s.id)},
          createdAt:{
            [Op.gte]: strDate,
            [Op.lt]: today,
          },
          type: 1, // Chỉ xóa các vấn đề liên quan đến lương
        },
      });
      
      for (const schedule of schedules) {
        const {workDate, employeeId, shiftId, id,startTime,endTime} = schedule;
        const shift = shifts.find(s => s.id == shiftId);
        if(!shift) {
          continue;
        }
        // const { startTime, endTime } = shift;
        const scheduledStart = dayjs(`${dayjs(schedule.workDate).format('YYYY-MM-DD')} ${startTime}`);
        const scheduledEnd = dayjs(`${dayjs(schedule.workDate).format('YYYY-MM-DD')} ${endTime}`);
        const requiredMinutes = scheduledEnd.diff(scheduledStart, 'minute');
        const mTimeSheet = timeSheets.find(ts => ts.employeeId == employeeId && ts.date == workDate);
        if(!mTimeSheet) {
          const status = ScheduleStatus.ABSENT; // Vắng mặt
          updatedSchedules.push({
            id: schedule.id,
            status,
            updatedAt: dayjs(), // để timestamps hoạt động đúng
          });
          const penalty = 60000;
          const message = 'Giảm trừ điểm nghỉ không xin phép';
          aInsertProblem.push({
            employeeId,
            belongId: id,
            type: 1,
            money:penalty,
            message,
            createdAtBigint:dayjs().unix()
          });
          continue;
        }
        console.log(mTimeSheet)
        const { id:timeSheetId, checkInTime, checkOutTime } = mTimeSheet;
        const actualCheckIn = dayjs(checkInTime);
        const actualCheckOut = dayjs(checkOutTime);
        const acturalFrom = actualCheckIn.isAfter(scheduledStart) ? actualCheckIn : scheduledStart;
        const acturalTo = actualCheckOut.isBefore(scheduledEnd) ? actualCheckOut : scheduledEnd;
        const workedMinutes = acturalTo.diff(acturalFrom, 'minute');
        const totalHours = Math.floor(workedMinutes / 60);
        let status = ScheduleStatus.COMPLETED; // Mặc định: đầy đủ
        let penalty = 0;
        const lateMinutes = actualCheckIn.diff(scheduledStart, 'minute');
        const earlyMinutes = scheduledEnd.diff(actualCheckOut, 'minute');
        
        const isLate = lateMinutes >= 15;
        const isEarly = earlyMinutes >= 15;
        const isShortTime = workedMinutes < requiredMinutes;
        let message = ''
        if (!checkInTime || !checkOutTime) {
          status = ScheduleStatus.ABSENT; // Vắng mặt
        } else if (isLate && isEarly) {
          status = ScheduleStatus.LATE_AND_EARLY_LEAVE; // Trễ & về sớm
          penalty += 30000;
          message = 'Giảm trừ điểm đi làm trễ và về sớm 15p';
        } else if (isLate) {
          status = ScheduleStatus.LATE;
          penalty += 30000;
          message = 'Giảm trừ điểm đi làm trễ  15p';
        } else if (isEarly) {
          status = ScheduleStatus.EARLY_LEAVE;
          penalty += 30000;
          message = 'Giảm trừ điểm đi về sớm 15p';
        }
        aUpdateTimeSheet.push
        ({
          id:timeSheetId,
          lateMinutes: lateMinutes > 0 ? lateMinutes : 0,
          earlyMinutes: earlyMinutes > 0 ? earlyMinutes : 0,
          actualHours:totalHours,
          updatedAt: dayjs(), // để timestamps hoạt động đúng
        });
        updatedSchedules.push({
          id: schedule.id,
          status,
          updatedAt: dayjs(), // để timestamps hoạt động đúng
        });
        if(penalty > 0) {
          aInsertProblem.push({
            employeeId,
            belongId: id,
            type: 1,
            money:penalty,
            message,
            createdAtBigint:dayjs().unix()
          });
        }
      }
      
      // 🔄 Cập nhật nhiều schedule
      if (updatedSchedules.length) {
        await Schedule.bulkCreate(updatedSchedules, {
          updateOnDuplicate: ['status', 'updatedAt',],
          
        });
      }
      if(aUpdateTimeSheet.length >0){
        await TimeSheet.bulkCreate(aUpdateTimeSheet, {
          updateOnDuplicate: ['updatedAt','lateMinutes', 'earlyMinutes', 'actualHours'],
          
        });
      }
      if( aInsertProblem.length) {
        await EmployeeProblem.bulkCreate(aInsertProblem,{});
      }
      // const finalGroupedSalaries = Array.from(groupedSalaryRecords.values());
      // // 💰 Thêm nhiều bản ghi lương
      // console.log(finalGroupedSalaries)
      // if (finalGroupedSalaries.length) {
      //   await Payroll.bulkCreate(finalGroupedSalaries,{transaction: t,});
      // }
      
    }catch(error) {
      console.error('Error in updateStatusAndSalary:', error);
    }
    
  }
  public async cronUpdateTimesheet(){

  }
}

Schedule.init(
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
    salaryHour: {
      type: DataTypes.INTEGER,
    },
    shiftId: {
        type: DataTypes.TINYINT,
        allowNull: false,
    },
    createdAtBigint: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    workDateBigint: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    workDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdBy:{
      type: DataTypes.INTEGER,
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
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Schedule',
    tableName: 'schedule',
    timestamps: true,
    underscored: true,
  },
);
Schedule.belongsTo(User, { foreignKey: 'employeeId', as: 'rEmployee' });
Schedule.belongsTo(Shift, { foreignKey: 'shiftId', as: 'rShift' });
Schedule.beforeCreate((schedule) => {
  schedule.createdAtBigint = dayjs().unix();
  schedule.workDateBigint = dayjs(schedule.workDate).unix();
})
export default Schedule;