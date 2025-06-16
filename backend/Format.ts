export const convertDate = (date: string) => {
    const [day, month, year] = date.split('-').map(Number); // Tách ngày, tháng, năm
    return new Date(year, month - 1, day); // Tạo đối tượng Date (tháng bắt đầu từ 0)
};
export const convertDateFormat = (date: string) => {
const [day, month, year] = date.split('/'); // Tách ngày, tháng, năm
    return new Date(`${year}-${month}-${day}`); // Kết hợp lại theo định dạng yyyy-MM-dd
};
export const convertToSlashFormat = (date: string, format = '/') => {
    const [year, month, day] = date.split('-'); // Tách năm, tháng, ngày
    return `${day}${format}${month}${format}${year}`; // Kết hợp lại theo định dạng dd/MM/yyyy
};
export const convertDateTimeToSlashFormat = (dateTime: string,format = '/') => {
    const [date, time] = dateTime.split(' '); // Tách phần ngày và giờ
    const [year, month, day] = date.split('-'); // Tách năm, tháng, ngày
    const [hour, minute] = time.split(':'); // Tách giờ và phút
    return `${day}${format}${month}${format}${year} ${hour}:${minute}`; // Kết hợp lại theo định dạng dd/MM/yyyy HH:mm
};
export const addDay = (dateStr: string | Date, num: number): Date => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + num);
    return date;
  };

export function slugify(str:string) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")   // bỏ dấu
      .replace(/[^a-z]/g, "");           // chỉ giữ chữ cái thường
  }
 export function generateUsername(fullName:string) {
    const parts = fullName.trim().split(/\s+/); // tách tên theo khoảng trắng
    const lastName = slugify(parts[parts.length - 1]); // phần cuối là tên chính
    const initials = parts
      .slice(0, -1)                      // phần còn lại là họ và tên đệm
      .map(word => slugify(word)[0])    // lấy chữ cái đầu
      .join('');
  
    return `${lastName}${initials}`;
}
  