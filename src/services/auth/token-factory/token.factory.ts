import { JWTPayload, jwtVerify, SignJWT } from 'jose';

import { Token } from './token.class';

interface IAccessTokenPayload {
  id: string;
  email: string;
}

interface ICoreTokenPayload {
  userId: string;
  inventoryId: string;
  role: string;
}

export class TokenFactory {
  static async getAccessToken(payload: IAccessTokenPayload): Promise<Token> {
    if (!payload?.id || !payload.email) {
      throw new Error('Invalid payload for access token');
    }
    const tokenValue = await this.signJwt(payload as unknown as JWTPayload, '30m');
    return new Token(tokenValue);
  }

  static async getCoreToken(payload: ICoreTokenPayload): Promise<string> {
    return this.signJwt(payload as unknown as JWTPayload, '1h');
  }

  static getRefreshToken(): Token {
    const bytes = new Uint8Array(64);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return new Token(hex);
  }

  static async hashRefreshToken(tokenValue: string): Promise<string> {
    const data = new TextEncoder().encode(tokenValue);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static async verifyAccessToken(token: string): Promise<IAccessTokenPayload | null> {
    const secretKey = this.getSecretKey();
    try {
      const { payload } = await jwtVerify(token, secretKey);
      return payload as unknown as IAccessTokenPayload;
    } catch {
      console.error('Token verification failed');
      return null;
    }
  }

  private static getSecretKey(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT secret key is not defined');
    return new TextEncoder().encode(secret);
  }

  private static async signJwt(payload: JWTPayload, expiresIn: string): Promise<string> {
    const key = this.getSecretKey();
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(key);
  }
}
