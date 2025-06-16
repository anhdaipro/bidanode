// cron/jobs/MidnightJob.ts
import Schedule from '../../models/Schedule';
import JobBase from './JobBase';
export default class JobDay extends JobBase {
  async run(): Promise<void> {
    const mSchedule = new Schedule
    // mSchedule.cronGenerateWeeklySchedule()
    mSchedule.updateStatusAndSalary()
  }
}