import Product from './models/Product';
import ProductTransaction from './models/ProductTransaction';
import ProductTransactionDetail from './models/ProductTransactionDetail';
ProductTransactionDetail.belongsTo(ProductTransaction,{
    foreignKey: 'transactionId',
  })
  ProductTransactionDetail.belongsTo(Product,{
    foreignKey: 'productId',
  })
ProductTransaction.hasMany(ProductTransactionDetail, {
    foreignKey: 'transactionId',
    as: 'details', // Đặt tên cho alias
});

