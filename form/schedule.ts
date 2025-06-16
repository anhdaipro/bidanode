export enum ScheduleStatus {
  NEW = 1,       // Đã xếp lịch
  COMPLETED = 8,       // Đã hoàn thành
  ABSENT = 2,          // Vắng mặt
  LEAVE = 3,           // Có phép
  OVERTIME = 4,        // Làm thêm giờ
  LATE = 5,            // Đi muộn
  LATE_AND_EARLY_LEAVE = 9, // Đi muộn và về sớm
  EARLY_LEAVE = 6,     // Về sớm
  CANCELLED = 7        // Ca bị hủy
}
export const TYPE_CHECKIN = 1;
export const TYPE_CHECKOUT = 2;
export const STATUS_LABELS: { [key in ScheduleStatus]: string } = {
  [ScheduleStatus.COMPLETED]: 'Hoàn thành',
  [ScheduleStatus.NEW]: 'Đã xác nhận',
  [ScheduleStatus.ABSENT]: 'Vắng mặt',
  [ScheduleStatus.LEAVE]: 'Có phép',
  [ScheduleStatus.OVERTIME]: 'Làm thêm giờ',
  [ScheduleStatus.LATE]: 'Đi muộn',
  [ScheduleStatus.EARLY_LEAVE]: 'Về sớm',
  [ScheduleStatus.CANCELLED]: 'Ca bị hủy',
  [ScheduleStatus.LATE_AND_EARLY_LEAVE]: 'Đi muộn và về sớm',
};
export const PAID_STATUSES = [
  ScheduleStatus.COMPLETED,
  ScheduleStatus.OVERTIME,
  ScheduleStatus.EARLY_LEAVE,
]; // Các trạng thái được tính lương