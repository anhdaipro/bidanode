// cron/jobs/JobBase.ts
export default abstract class JobBase {
    abstract run(): Promise<void>; // 👈 khai báo abstract method
}