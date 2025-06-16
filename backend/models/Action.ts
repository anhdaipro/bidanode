import { Model, DataTypes } from 'sequelize';
import sequelize from '../database/db';
import path from 'path';
class Action extends Model {
    public controllerName!: string
    public description!: string
    public action!: string;
    async  getActionsByControllerName(controllerName: string): Promise<string[]> {
        try {
          // Đường dẫn tới file controller (có thể là .ts hoặc .js)
          const controllerPathTs = path.join(__dirname, 'controllers', `${controllerName}.ts`);
          const controllerPathJs = path.join(__dirname, 'controllers', `${controllerName}.js`);
      
          // Tải module controller (thử .ts trước, nếu lỗi thì thử .js)
          let controllerModule;
          try {
            controllerModule = require(controllerPathTs);
          } catch {
            controllerModule = require(controllerPathJs);
          }
      
          const controller = controllerModule.default || controllerModule;
      
          // Lấy các method instance (trừ constructor)
          const methodNames = Object.getOwnPropertyNames(controller.prototype || {})
            .filter(name => {
              if (name === 'constructor') return false;
              const fn = controller.prototype ? controller.prototype[name] : undefined;
              return typeof fn === 'function';
            });
      
          // Nếu ko tìm thấy instance method, thử lấy static method
          if (methodNames.length === 0) {
            return Object.getOwnPropertyNames(controller)
              .filter(name => {
                return !['length', 'prototype', 'name'].includes(name) && typeof controller[name] === 'function';
              });
          }
      
          return methodNames;
        } catch (error) {
          console.error(`Controller ${controllerName} not found or error loading:`, error);
          return [];
        }
      }
}

Action.init({
    controllerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
}, {
  sequelize,
  tableName: 'actions',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['controller_name', 'action'],
    },
  ],
});

export default Action;
