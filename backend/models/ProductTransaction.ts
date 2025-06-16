import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/db';
import ProductTransactionDetail from './ProductTransactionDetail';
import Product from './Product';
import { EXPORT, IMPORT } from '@form/transaction';
import User from './User';
import TableSession from './TableSession';
import TableOrder from './TableOrder';
import dayjs from 'dayjs';
export default class ProductTransaction extends Model {
  public id!: number;//db
  public codeNo!: string;//db
  public type!: number; //db 1: Nhập, 2: Xuất
  public totalAmount!: number;//db tiền
  public dateDelivery!: string;//db ngày nhập xuất
  public dateDeliveryBigint!: number;//db
  public uidLogin!: number;//db
  public sessionId!: number;//db
  public readonly createdAt!: Date;//db
  public readonly updatedAt!: Date;//db
  public codeSession?: string;
  public async getCodeNoSession(){
    const session = await TableSession.findByPk(this.sessionId)
    if(session){
      return session.codeNo
    }
    return ''
  }
  public async createFromSession(session:TableSession){
    const strToday = dayjs().format('YYYY-MM-DD');
    const date = dayjs(strToday);
    // const productTransaction = new ProductTransaction
    const orders = await TableOrder.findAll({
      where:{sessionId: session.id}
    }); 
    if(orders.length == 0){
      return;
    }
    this.type = EXPORT
    this.totalAmount = session.totalAmount - session.amountTable- session.discountAmount
    this.dateDelivery = strToday;
    this.dateDeliveryBigint = date.unix();
    await this.save();
    const productTransactionDetails = orders.map((detail: TableOrder) => ({
      transactionId: this.id,
      productId: detail.productId,
      type:EXPORT,
      categoryId:detail.categoryId, 
      quantity: detail.quantity,
      price: detail.price,
      totalPrice: detail.quantity * detail.price,
      dateDelivery:date,
      dateDeliveryBigint:date.unix(),
      uidLogin:session.uidLogin,
    }));
    await ProductTransactionDetail.bulkCreate(productTransactionDetails);
  }
}

ProductTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    codeNo:{
        type:DataTypes.CHAR,
        unique :true,
    },
    uidLogin:{
      type:DataTypes.INTEGER,
      allowNull:false,
    },
    sessionId:{
      type:DataTypes.INTEGER,
      allowNull:true,
    },
    type: {
      type: DataTypes.TINYINT, // 1: Nhập, 2: Xuất
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dateDelivery: {
      type: DataTypes.DATE,
      allowNull: false,
      // get() {
      //   const rawValue = this.getDataValue('dateDelivery'); // Lấy giá trị gốc từ cơ sở dữ liệu
      //   if (!rawValue || !(rawValue instanceof Date)) {
      //     return null; // Trả về null nếu giá trị không hợp lệ
      //   }
      //   return rawValue.toISOString().split('T')[0]; // Trả về chuỗi định dạng yyyy-MM-dd
      // },
    },
    dateDeliveryBigint:{
        type: DataTypes.BIGINT,
    },
  },
  {
    sequelize,
    modelName: 'ProductTransaction',
    tableName:'product_transaction',
    underscored: true,
    timestamps: true,
  },
);
ProductTransaction.beforeCreate(async (transaction) => {
  let isUnique = false;
  let randomString = '';
  const currentYear = new Date().getFullYear(); // Lấy năm hiện tại
  while (!isUnique) {
    // Tạo chuỗi ngẫu nhiên chỉ chứa chữ cái
    randomString = Array.from({ length: 5 }, () =>
        String.fromCharCode(Math.floor(Math.random() * 26) + 65) // Ký tự từ A-Z
    ).join('');
    const codeNo = `T${currentYear}${randomString}`.toUpperCase(); // Kết hợp chuỗi ngẫu nhiên với năm
    // Kiểm tra xem codeNo đã tồn tại trong DB chưa
    const existingTransaction = await ProductTransaction.findOne({
        where: { codeNo },
    });
    if (!existingTransaction) {
        isUnique = true; // Nếu không tồn tại, chuỗi là duy nhất
        transaction.codeNo = codeNo; // Gán codeNo cho transaction
    }
  }
  //set dateDeliveryBigint
  transaction.dateDeliveryBigint = dayjs(transaction.dateDelivery).unix();
});
ProductTransaction.beforeDestroy(async (transaction, options) => {
    await ProductTransactionDetail.destroy({
      where: { transactionId: transaction.id },
      transaction: options.transaction, // để đảm bảo xóa trong cùng transaction nếu có
    });
});
ProductTransaction.belongsTo(User,{
  foreignKey: 'uidLogin',
  as:'rUidLogin'
})
ProductTransactionDetail.belongsTo(ProductTransaction,{
  foreignKey: 'transactionId',
})
ProductTransactionDetail.belongsTo(Product,{
  foreignKey: 'productId',
  as:'rProduct', // Đặt tên cho alias
})
ProductTransaction.hasMany(ProductTransactionDetail, {
  foreignKey: 'transactionId',
  as: 'details', // Đặt tên cho alias
});

// export  ProductTransaction
