import JobDay from "./jobs/JobDay";
import cron from 'node-cron';
cron.schedule(
    '* * * * *', // Chạy mỗi phút
    async () => {
      const job = new JobDay();
      await job.run();
      console.log(123)
    },
    {
      timezone: 'Asia/Ho_Chi_Minh', // 🇻🇳 Giờ Việt Nam
    }
  );