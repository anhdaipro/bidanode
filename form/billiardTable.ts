
export const STATUS_AVAILABLE = 1;
export const STATUS_PLAYING = 2;
export const STATUS_WAIT_PAID = 3;
export const STATUS_MAINTENANCE = 4;
export const STATUS_PAID = 5;
const TYPE_POOL = 1;
const TYPE_CAROM = 2;
export const LSTATUS=[
    STATUS_AVAILABLE,
    STATUS_PLAYING,
    STATUS_MAINTENANCE,
]
export const STATUS_LABELS: Record<number, string> = ({
[STATUS_AVAILABLE]: 'Đang trống',
[STATUS_PLAYING]: 'Đang sử dụng',
[STATUS_MAINTENANCE]: 'Bảo trì',
[STATUS_WAIT_PAID]: 'Chờ thanh toán',
});
export const STATUS_SESSION_LABELS: Record<number, string> = ({
    [STATUS_PLAYING]: 'Đang sử dụng',
    [STATUS_WAIT_PAID]: 'Chờ thanh toán',
    [STATUS_PAID]: 'Đã thanh toán',
    });
export const TYPE_LABELS: Record<number, string> = ({
    [TYPE_POOL]: 'Bàn lỗ',
    [TYPE_CAROM]: 'Bàn không lỗ',
});
export const LSESSIONACTIVE = [
    STATUS_PLAYING,
    STATUS_WAIT_PAID
]