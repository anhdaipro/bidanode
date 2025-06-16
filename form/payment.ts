export enum PAYMENT_METHOD {
    CASH = 1,
    ONLINE = 2,
    MIXED = 3,
}
  
export const PAYMENT_METHOD_LABELS: Record<PAYMENT_METHOD, string> = {
    [PAYMENT_METHOD.CASH]: 'Tiền mặt',
    [PAYMENT_METHOD.ONLINE]: 'Online',
    [PAYMENT_METHOD.MIXED]: 'Kết hợp',
  };