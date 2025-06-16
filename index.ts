import { createServer } from 'http'
import { parse } from 'url'


import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
// Load biến môi trường từ file .env
dotenv.config();
const server = express();
server.use(cors({
  origin: 'http://localhost:5173', // 👈 thêm đúng frontend origin
  credentials: true, // nếu dùng cookie hoặc auth header
}));
import productTransactionRoutes from '@backend/routes/productTransactionRoutes';
import productRoutes from '@backend/routes/productRoutes';
import userRoutes from '@backend/routes/userRoutes';
import billiardTableRoutes from '@backend/routes/billiardTableRouter';
import tableSessionRoutes from '@backend/routes/tableSessionRoutes';
import reportRoutes from '@backend/routes/reportRouter';
import paymentRoutes from '@backend/routes/paymentRoutes'
import employeeRoutes from '@backend/routes/employeeRoute'
import shiftRoutes from '@backend/routes/shiftRoutes'
import scheduleRoutes from '@backend/routes/scheduleRouter'
import timeSheetRoutes from '@backend/routes/timeSheetRouter'
import bodyParser from  'body-parser';
  // Middleware để parse JSON
  server.use(bodyParser.json()); 
  // for parsing application/xwww-
  server.use(bodyParser.urlencoded({ extended: true })); 
  //form-urlencoded
  server.use('/api', userRoutes)
  server.use('/api/employee', employeeRoutes)
  server.use('/api/product-transactions', productTransactionRoutes)
  server.use('/api/products', productRoutes);
  server.use('/api/payment', paymentRoutes);
  server.use('/api/tablesession', tableSessionRoutes);
  server.use('/api/report', reportRoutes);
  server.use('/api/billiard-table', billiardTableRoutes);
  server.use('/api/shift', shiftRoutes);
  server.use('/api/schedule', scheduleRoutes);
  server.use('/api/timesheet', timeSheetRoutes);
  const PORT =process.env.PORT ||5000
  server.listen(PORT, ()=>{
      console.log(`server is running ${PORT}`)
  })

//lsof -i :3000
//kill -9 119792