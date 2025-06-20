import { genSalt, hash, compare } from 'bcryptjs';

export class PasswordFactory {
  static async generateHashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const salt = await genSalt(saltRounds);
    const hashedPassword = await hash(password, salt);
    return hashedPassword;
  }
  static async verify(plain: string, hashed: string): Promise<boolean> {
    if (!plain || !hashed) {
      throw new Error('Password and hash are required for verification');
    }
    return await compare(plain, hashed);
  }
}
