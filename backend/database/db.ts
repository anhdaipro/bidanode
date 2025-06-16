import { Sequelize } from 'sequelize';
const password = process.env.AIVEN_PASSWORD;// Kết nối với MySQL
const host = process.env.HOST
const sequelize = new Sequelize('bida', 'avnadmin', password, {
  host: host, // Địa chỉ MySQL server
  dialect: 'mysql',  // Sử dụng MySQL
  logging: false,    // Tắt log SQL (tuỳ chọn)
  port: 18623,
  timezone: '+07:00', // múi giờ VN
  dialectOptions: {
    dateStrings: true,
    typeCast: true
  },
});

export default sequelize;