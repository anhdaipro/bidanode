export const STATUS_ACTIVE = 1
export const STATUS_INACTIVE = 2
export const STATUS_LABEL: Record<number, string> = {
[STATUS_ACTIVE]: 'Hoạt động',
[STATUS_INACTIVE]: 'Không hoạt động',
}
export enum SHIFT_TYPES {
    MORNING= 1,
    AFTERNOON= 2,
    NIGHT= 3,
    ADMINISTRATIVE = 4,
};
export const SHIFT_LABELS: Record<SHIFT_TYPES, string> = {
    [SHIFT_TYPES.MORNING]: 'Ca sáng 08:00 - 12:00',
    [SHIFT_TYPES.AFTERNOON]: 'Ca chiều 13:00 - 17:00',
    [SHIFT_TYPES.NIGHT]: 'Ca tối 18:00 - 22:00',
    [SHIFT_TYPES.ADMINISTRATIVE]: 'Ca hành chính 08:00 - 17:00',
};
export const SHIFT_RANDOM =  [
    SHIFT_TYPES.MORNING,
    SHIFT_TYPES.AFTERNOON,
    SHIFT_TYPES.NIGHT,
]