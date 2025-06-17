import { prisma } from './index';

export class UserDatabase {
  static async getUserByEmail(email: string) {
    return await prisma.users.findUnique({
      where: { email },
    });
  }
}
