export const IMPORT = 1 // Nhập
export const EXPORT = 2 // Xuất
export const TRANSACTION_TYPES = [
    IMPORT,
    EXPORT,
]
export const TRANSACTION_TYPE_LABELS: Record<number, string> = {
[IMPORT]: 'Nhập hàng',
[EXPORT]: 'Xuất hàng',
}