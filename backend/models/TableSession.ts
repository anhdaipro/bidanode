import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/db';
import BilliardTable from './BilliardTable'; // nếu có
import TableOrderDetail from './TableOrder';
import User from './User';
import { ROLE_ADMIN } from '../BidaConst';
import { STATUS_AVAILABLE, STATUS_PAID, STATUS_PLAYING, STATUS_WAIT_PAID } from '@form/billiardTable';
import { PAYMENT_METHOD } from '@form/payment';
import Reward from './Reward';
import dayjs from 'dayjs';
const DEBIT = 1;
const NO_DEBIT = 2
const STATUS_DEBIT = [
  DEBIT,
  NO_DEBIT
]

class TableSession extends Model {
    public id!: number;
    public codeNo!:string;//
    public tableId!: number;//số bàn
    public playerName!: string; // hoặc playerId nếu liên kết User
    public startTime!: Date;//thời gian bắt đầu chơi
    public endTime!: Date; // có thể null nếu đang chơi
    public status!: number;//trạng thái bàn
    public phone!: string;//số điện thoại khách
    public uidLogin!:number;
    public employeeId!:number;
    public paymentMethod!:number;
    public note!:string;
    public createdAtBigint!: number;
    public playedMinutes!: number;//số phút chơi
    public amountTable!: number;//tiền bàn
    public statusDebit!:number;//
    public amountOrder!: number;//tiền bàn
    public customerId!: number;//tiền bàn
    public totalAmount!:number;//tổng tiền(gồm tiền uống nước, sản phẩm khác)
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public discountAmount!:number;
    public canUpdate!:boolean;
    public canDelete!: boolean;
    public errors: { [key: string]: string } = {};
    public validateCreate(){
      const aStatusFinish = [
        STATUS_WAIT_PAID,
        STATUS_PAID,
      ]
      if((this.status != STATUS_PLAYING && !this.endTime) || (aStatusFinish.includes(this.status) && !this.endTime)){
        this.errors['status'] = 'Vui lòng kiểm tra lại thời gian kết thúc và trạng thái\n'
      }
      if((this.status == STATUS_PAID && !this.paymentMethod)){
        this.errors['paymentMethod'] = 'Vui lòng kiểm tra lại phương thức thanh toán\n'
      }
     
    }
    public fnCanUpdate(user:User){
      if(user.id == this.uidLogin || user.roleId == ROLE_ADMIN){
        this.canUpdate = true;
      }
      this.canUpdate = false;
    }
    public fnCanDelete(user:User){
      if(user.roleId == ROLE_ADMIN){
        this.canDelete = true;
      }
      this.canDelete = false;
    }
    public fnCalculatePlayedMinutes(){
      const startTime = new Date(this.startTime).getTime();
      const now = this.endTime ? new Date(this.endTime).getTime() : Date.now();
      const playedMinutes = Math.ceil((now - startTime) / 60000);
      return playedMinutes;
    }
    public async getTablePlaying(){
      const aSession = await TableSession.findAll({
        where:{
          status:STATUS_PLAYING
        },
        attributes:['id', 'phone', 'playerName','playedMinutes','startTime','endTime'],
        include:{ model: BilliardTable, as: 'table', attributes:['id', 'tableNumber'] },
      })
      const data = aSession.map((session:TableSession)=>{

        const plain = session.get({ plain: true }); // toàn bộ data thường
        return {...plain.table,playedMinutes: session.fnCalculatePlayedMinutes()}
      })
      return data;
    }
    
}

TableSession.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    codeNo:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    tableId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    playerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: true,
    },
    createdAtBigint:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    totalAmount:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    customerId:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amountTable:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amountOrder:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    playedMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      discountAmount:{
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        
      },
      employeeId:{
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    paymentMethod:{
      type: DataTypes.TINYINT,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: 'TableSession',
    tableName: 'table_session',
    timestamps: true,
    underscored: true,
  }
);
TableSession.beforeCreate(async (tableSession) => {
  let isUnique = false;
  let randomString = '';
  tableSession.createdAtBigint = dayjs(tableSession.createdAt).unix(); // Lưu thời gian tạo phiên làm việc
  const currentYear = new Date().getFullYear(); // Lấy năm hiện tại
  while (!isUnique) {
    // Tạo chuỗi ngẫu nhiên chỉ chứa chữ cái
    randomString = Array.from({ length: 5 }, () =>
        String.fromCharCode(Math.floor(Math.random() * 26) + 65) // Ký tự từ A-Z
    ).join('');
    const codeNo = `S${currentYear}${randomString}`.toUpperCase(); // Kết hợp chuỗi ngẫu nhiên với năm
    // Kiểm tra xem codeNo đã tồn tại trong DB chưa
    const existingTableSession = await TableSession.findOne({
        where: { codeNo },
    });
    if (!existingTableSession) {
        isUnique = true; // Nếu không tồn tại, chuỗi là duy nhất
        tableSession.codeNo = codeNo; // Gán codeNo cho transaction
    }
  }
  //set dateDeliveryBigint
});
TableSession.hasMany(TableOrderDetail, {
    foreignKey: 'sessionId',
    as: 'orders',
  })
TableSession.belongsTo(BilliardTable, {
    foreignKey: 'tableId',
    as: 'table',
  });
TableSession.belongsTo(User, {
  foreignKey: 'uidLogin',
  as: 'rUidLogin',
});
TableSession.belongsTo(User, {
  foreignKey: 'customerId',
  as: 'customer',
});
export default TableSession;
