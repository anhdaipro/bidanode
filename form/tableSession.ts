import { STATUS_PLAYING, STATUS_WAIT_PAID } from "./billiardTable";

const STATUS_NEW = 0;
export const STATUS_PAID = 2;
const STATUS_CANCEL = 3;
const STATUS_LABELS: Record<number, string> = {
  [STATUS_PLAYING]: 'Đang chơi',
  [STATUS_NEW]: 'Mới',
  [STATUS_CANCEL]: 'Đã hủy',
};
export const LSTATUSACTIVE = [
    STATUS_PLAYING,
    STATUS_WAIT_PAID,
]
