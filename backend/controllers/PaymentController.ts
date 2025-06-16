import { Request, Response } from 'express';
import { PAYMENT_METHOD, PAYMENT_METHOD_LABELS } from '@form/payment';
import Payment from '../models/Payment'
import fs from 'fs'
import TableSession from '../models/TableSession';
import { STATUS_AVAILABLE, STATUS_PAID } from '@form/billiardTable';
import BilliardTable from '../models/BilliardTable';
import ProductTransaction from '../models/ProductTransaction';
import User from '../models/User';
import Reward from '../models/Reward';
import { PageTitlesMap } from '@type/controller';

class PaymentController {
  static pageTitles: PageTitlesMap = {
    createPayment: 'Tạo thanh toán',
    updatePayment: 'Cập nhật thanh toán',
    getAllPayments: 'Danh sách thanh toán',
    getPaymentById: 'Thông tin thanh toán',
    deletePayment: 'Xóa thanh toán',
};
  // Tạo một thanh toán mới
  public static async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, cashAmount, onlineAmount, method, note, isUsePoint } = req.body;
      const employeeId = req.user?.id
      console.log(`employeeId`, req.user)
      if (!employeeId) {
        res.status(400).json({ message: 'Không thể lấy ID người dùng' });
        return;
      }
      const session = await TableSession.findByPk(sessionId);
      if(!session){
        res.status(404).json({
          message: 'Phiên chơi không tồn tại',
        });
        return;
      }
      let totalAmount = session.amountOrder + session.amountTable//25K
      let discountAmount = 0
      if(isUsePoint){
        const customer = await User.findByPk(session.customerId)
        if(customer){
          let point = customer.point;//400
          // Tính số điểm có thể quy đổi ban đầu
          let usablePoints = Math.floor(point / 10);//40
          discountAmount = usablePoints * 1000;//40K

          // Nếu vượt quá tổng tiền thì giảm bớt điểm
          if (discountAmount > totalAmount) {
            usablePoints = Math.floor(totalAmount / 10000); // Chỉ dùng đủ để không vượt 25
            discountAmount = usablePoints * 10000;//25
          }

          // Trừ điểm đã dùng
          const pointsUsed = usablePoints * 10;
          await Reward.create({
            point: -pointsUsed,
            customerId: session.customerId,
            uidLogin:employeeId,
            phone:customer.phone,
            sessionId,
          })
          const remainingPoints = point - pointsUsed;
          customer.point = remainingPoints
          totalAmount -= discountAmount
          await customer.save()
        }
      }
      const paidAt = new Date()
      const paidAtBigint = paidAt.getTime()
      const payment = await Payment.create({
        sessionId,
        totalAmount,
        cashAmount,
        onlineAmount,
        method,
        employeeId,
        paidAt,
        paidAtBigint,
        note,
      });
      session.totalAmount = totalAmount
      session.discountAmount = discountAmount
      session.status = STATUS_PAID
      await session.save();
      const mProductTransaction = new ProductTransaction()
      mProductTransaction.uidLogin = employeeId
      await mProductTransaction.createFromSession(session);
      const table = await BilliardTable.findByPk(session.tableId)
      if(table){
        table.status = STATUS_AVAILABLE
        await table.save();
      }
      res.status(201).json({
        message: 'Payment created successfully',
        data: payment,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error creating payment',
        error: errorMessage,
      });
    }
  }

  // Lấy danh sách tất cả các thanh toán
  public static async getAllPayments(req: Request, res: Response): Promise<void> {
    try {
      const payments = await Payment.findAll();

      res.status(200).json({
        message: 'Payments retrieved successfully',
        data: payments,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving payments',
        error: errorMessage,
      });
    }
  }

  // Lấy thông tin một thanh toán theo ID
  public static async getPaymentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const payment = await Payment.findByPk(id);

      if (!payment) {
        res.status(404).json({
          message: 'Payment not found',
        });
        return;
      }

      res.status(200).json({
        message: 'Payment retrieved successfully',
        data: payment,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving payment',
        error: errorMessage,
      });
    }
  }

  // Cập nhật thông tin một thanh toán
  public static async updatePayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { sessionId, amount, totalAmount, cashAmount, onlineAmount, discount, method, paidAt, note } = req.body;

      const payment = await Payment.findByPk(id);
      const session = await TableSession.findByPk(sessionId)
      if (!payment || !session) {
        res.status(404).json({
          message: 'Payment not found',
        });
        return;
      }

      await payment.update({
        sessionId,
        amount,
        totalAmount,
        cashAmount,
        onlineAmount,
        discount,
        method,
        paidAt,
        note,
      });
      session.status = STATUS_PAID
      session.save()
      res.status(200).json({
        message: 'Payment updated successfully',
        data: payment,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error updating payment',
        error: errorMessage,
      });
    }
  }

  // Xóa một thanh toán
  public static async deletePayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const payment = await Payment.findByPk(id);

      if (!payment) {
        res.status(404).json({
          message: 'Payment not found',
        });
        return;
      }

      await payment.destroy();

      res.status(200).json({
        message: 'Payment deleted successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error deleting payment',
        error: errorMessage,
      });
    }
  }
 
  public static async createQrCode(req: Request, res: Response): Promise<void> {
    const { tableId, amount } = req.body;
    const requestData = {
      accountNo: '1471399083', // Số tài khoản nhận
      accountName: 'PHAM VAn DAI', // Tên chủ tài khoản
      acqId: '970418', // Vietcombank
      addInfo: `BIDA_BAN_${tableId}_${new Date().toISOString().split('T')[0]}`,
      amount: amount.toString(),
      template: 'compact'
    };
    try {
      // const response = await axios.post('https://api.vietqr.io/v2/generate', requestData, {
      //   headers: {
      //     'x-client-id': process.env.VIETQR_CLIENT_ID,
      //     'x-api-key': process.env.VIETQR_API_KEY,
      //     'Content-Type': 'application/json'
      //   }
      // });

      // res.json(response.data);
    }  catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error deleting payment',
        error: errorMessage,
      });
    }
  }
  // Lấy danh sách thanh toán theo phương thức thanh toán
  public static async getPaymentsByMethod(req: Request, res: Response): Promise<void> {
    try {
      const { method } = req.params;

      if (!Object.values(PAYMENT_METHOD).includes(Number(method))) {
        res.status(400).json({
          message: 'Invalid payment method',
        });
        return;
      }

      const payments = await Payment.findAll({
        where: { method: Number(method) },
      });

      res.status(200).json({
        message: `Payments retrieved successfully`,
        data: payments,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        message: 'Error retrieving payments by method',
        error: errorMessage,
      });
    }
  }
}

export default PaymentController;