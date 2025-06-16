const SNACK = 1
const DRINK = 2
const ALCOHOL = 3
const MAIN_MEAL = 4
const TOBACCO = 5
const TABLE_BIDA = 6
export const STATUS_ACTIVE = 2
export const STATUS_INACTIVE = 1
export const LSTATUS = [
  STATUS_ACTIVE,
  STATUS_INACTIVE,
]
export const STATUS_LABEL: Record<number, string> = {
  [STATUS_ACTIVE]: 'Hoạt động',
  [STATUS_INACTIVE]: 'Không hoạt động',
}
export const maxSizeMB = 2;
export const maxSizeBytes = maxSizeMB * 1024 * 1024;
export const CATEGORY = [
  SNACK,
  DRINK,
  ALCOHOL,
  MAIN_MEAL,
  TOBACCO,
  TABLE_BIDA
]
export const CATEGORY_ORDER = [
  SNACK,
  DRINK,
  ALCOHOL,
  MAIN_MEAL,
  TOBACCO,
]
export const CATEGORY_LABELS: Record<number, string> = {
    [SNACK]: 'Đồ ăn nhẹ',
    [DRINK]: 'Nước giải khát',
    [ALCOHOL]: 'Thức uống có cồn',
    [MAIN_MEAL]: 'Món ăn chính',
    [TOBACCO]: 'Thuốc lá',
    [TABLE_BIDA]: 'Bida',
};