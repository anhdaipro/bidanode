import { DataTypes, Model,Sequelize } from 'sequelize';
import sequelize from '../database/db';
import Product from './Product';
import dayjs from 'dayjs';
export default class ProductTransactionDetail extends Model {
  //db
  public id!: number;
  public transactionId!: number;
  public productId!: number;
  public quantity!: number;
  public type!: number;
  public categoryId!: number;
  public price!: number;
  public totalPrice!: number;
  public uidLogin!: number;
  public dateDelivery!: Date;//db ngày nhập xuất
  public dateDeliveryBigint!: number;//db
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  //end db
  static associate(models:any ) {
    this.belongsTo(models.ProductTransaction,{
      foreignKey: 'transactionId',
      as: 'details',
    });
    this.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'rProduct',
    });
  }
  public getTotal(){
    return this.quantity* this.price
  }
  public async getProduct(){
    const mProduct = await Product.findByPk(this.productId);
    if(!mProduct){
      return null;
    }
    return mProduct;
  }
}

ProductTransactionDetail.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    uidLogin:{
      type:DataTypes.INTEGER,
      allowNull:false,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dateDelivery: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dateDeliveryBigint:{
        type: DataTypes.BIGINT,
    },
  },
  {
    sequelize,
    underscored: true,
    tableName:'product_transaction_detail',
    timestamps: true,
  },
);
ProductTransactionDetail.beforeCreate((detail) => {
  detail.dateDeliveryBigint = dayjs(detail.dateDelivery).unix();
});



