import { DataTypes, Model } from 'sequelize';
class BaseModel extends Model{
    public dateFrom!: Date;
    public dateTo!: Date;
}
export default BaseModel