import jwt from 'jsonwebtoken';

export function verifyQrToken(token: string): number | null {
  try {
    const decoded = jwt.verify(token, process.env.QR_SECRET!) as { employeeId: number };
    return decoded.employeeId;
  } catch (e) {
    return null;
  }
}