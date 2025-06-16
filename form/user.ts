export const STATUS_ACTIVE = 1
export const STATUS_INACTIVE = 2
export const ROLE_ADMIN = 1;
export const ROLE_EMPLOYEE = 2;
export const ROLE_CUSTOMER = 3;
export const ROLE_MANAGE = 4;
export const ROLE_SECURITY = 8;
const ROLE_ACCOUNTING = 5;
const ROLE_CASHIER = 6;
const ROLE_CRAFT_WAREHOUSE = 7;
const TYPE_EDUCATION_1 = 1
const TYPE_EDUCATION_2 = 2
const TYPE_EDUCATION_3 = 3
const TYPE_EDUCATION_4 = 4

const BANK_BIDV = 1;
const BANK_VIETCOMBANK = 2;
const BANK_TELECOM = 3;
const SALARY_TYPE_HOUR = 1; // Lương theo giờ
const SALARY_TYPE_MONTH = 2; // Lương theo tháng
export const SALARY_TYPE_LABEL: Record<number, string> = {
  [SALARY_TYPE_HOUR]: 'Lương theo giờ',
  [SALARY_TYPE_MONTH]: 'Lương theo tháng',
};
export const STATUS_LABEL: Record<number, string> = {
  [STATUS_ACTIVE]: 'Hoạt động',
  [STATUS_INACTIVE]: 'Không hoạt động',
}
export const BANK_LABELS: Record<number, string> = {
  [BANK_BIDV]: 'Ngân hàng BIDV',
  [BANK_VIETCOMBANK]: 'Ngân hàng Vietcombank',
  [BANK_TELECOM]: 'Ngân hàng Viễn thông',
};
export const STATUS_LABELS: Record<number, string> = {
  [STATUS_ACTIVE]: 'Hoạt động',
  [STATUS_INACTIVE]: 'Không hoạt động',
}

export const ROLE_LABELS: Record<number, string> = {
  [ROLE_ADMIN]: 'Quản trị viên',
  [ROLE_EMPLOYEE]: 'Nhân viên',
  [ROLE_CUSTOMER]: 'Khách hàng',
  [ROLE_MANAGE]: 'Giám sát',
};
export const POSITION_LABELS: Record<number, string> = {
  [ROLE_ADMIN]: 'Quản trị viên',
  [ROLE_EMPLOYEE]: 'Nhân viên',
  [ROLE_MANAGE]: 'Giám sát',
  [ROLE_ACCOUNTING]: 'Kế toán',
  [ROLE_CASHIER]: 'Thu ngân',
  [ROLE_CRAFT_WAREHOUSE]: 'Thủ kho',
  [ROLE_SECURITY]: 'Bảo vệ',
};
export const TYPE_EDUCATION_LABELS: Record<number, string> = {
  [TYPE_EDUCATION_1]: 'Cao đẳng',
  [TYPE_EDUCATION_2]: 'Đại học',
  [TYPE_EDUCATION_3]: 'Sau đại học',
  [TYPE_EDUCATION_4]: 'Phổ thông',
}
export const ROLES_EMPLOYEE = [
  ROLE_EMPLOYEE,
  ROLE_MANAGE,
  ROLE_ACCOUNTING,
  ROLE_CASHIER,
  ROLE_CRAFT_WAREHOUSE,
  ROLE_SECURITY,
]