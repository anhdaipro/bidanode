import fs from 'fs';
import path from 'path';
import sequelize from '../backend/database/db';
import Action from '../backend/models/Action';
const controllersDir = path.join(__dirname, '../backend/controllers');
async function main() {
  await sequelize.authenticate();

  const files = fs.readdirSync(controllersDir);

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

    const controllerPath = path.join(controllersDir, file);
    const controllerModule = require(controllerPath);
    const controller = controllerModule.default || controllerModule;
    const controllerName = path.basename(file, path.extname(file)); // e.g. ProductTransactionController

    // Lấy danh sách method (chỉ những method function)
    const methodNames = Object.getOwnPropertyNames(controller)
    .filter(name => {
        if (name === 'length' || name === 'prototype' || name === 'name') return false;
        const fn = controller[name];
        return typeof fn === 'function';
    });

    for (const methodName of methodNames) {
      // Lấy mô tả từ pageTitles map (nếu có)
      const description = controller.pageTitles?.[methodName] || methodName;

      // Kiểm tra tồn tại, nếu chưa có thì tạo
      const [actionRecord, created] = await Action.findOrCreate({
        where: {
          controller_name: controllerName,
          action: methodName,
        },
        defaults: {
          description,
        },
      });

      if (!created && actionRecord.description !== description) {
        actionRecord.description = description;
        await actionRecord.save();
      }

      console.log(created ? `Created action: ${controllerName}.${methodName}` : `Exists action: ${controllerName}.${methodName}`);
    }
  }

  await sequelize.close();
}

main().catch(console.error);