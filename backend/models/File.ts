import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/db';
import fs from 'fs';
import path from 'path';
export const TYPE_PRODUCT = 1;
class File extends Model {
  public id!: number;
  public url!: string;
  public file_name!: string;
  public belongId!: number;
  public type!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

File.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    belongId: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
  },
  {
    sequelize,
    modelName: 'File',
    tableName: 'file',
    underscored: true,
    timestamps: true, // Tự động thêm createdAt và updatedAt
  },
);
File.beforeDestroy(async (file: File) => {
  const uploadDir = path.resolve(__dirname, '../../'); // Quay lại 2 bậc từ backend/models/ tới uploads/
    const imagePath = path.join(uploadDir, file.url); // product.image chứa tên file ảnh
    try {
      // Xóa file ảnh
      await fs.promises.unlink(imagePath);
      console.log(`Image deleted: ${imagePath}`);
    } catch (err: any) {
      // Nếu lỗi không phải là "file không tồn tại", log lỗi
      if (err.code !== 'ENOENT') {
        console.error('Error deleting image:', err);
      } else {
        console.warn(`Image not found: ${imagePath}`);
      }
    }
})
export default File;