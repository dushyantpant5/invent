import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function generateHashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

export function generateAccessToken(id: string, email: string) {
  const payload = {
    id: id,
    email: email,
  };
  const secretKey: string = process.env.JWT_SECRET || '';
  return jwt.sign(payload, secretKey);
}

export function generateRefreshToken(id: string) {
  const payload = {
    id: id,
  };
  const secretKey: string = process.env.JWT_SECRET || '';
  return jwt.sign(payload, secretKey);
}
