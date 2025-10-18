import { JWTPayload, jwtVerify, SignJWT } from 'jose';

import { Token } from './token.class';

interface IAccessTokenPayload {
  id: string;
  email: string;
}

export class TokenFactory {
  static async getAccessToken(payload: IAccessTokenPayload): Promise<Token> {
    if (!payload?.id || !payload.email) {
      throw new Error('Invalid payload for access token');
    }

    const tokenValue: string = await this.signAccessTokenWithJWT(payload);
    return new Token(tokenValue);
  }

  static getRefreshToken(): Token {
    const bytes = new Uint8Array(64);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return new Token(hex);
  }

  static async getRefreshTokenHash(token: Token): Promise<Token> {
    if (!(token instanceof Token)) {
      throw new Error('Invalid token instance');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(token.tokenValue);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return new Token(hashHex);
  }

  static async hashRefreshToken(tokenValue: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(tokenValue);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  static async verifyAccessToken(token: string): Promise<IAccessTokenPayload | null> {
    const secret: string | undefined = process.env.JWT_SECRET;
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);

    if (!secretKey) {
      throw new Error('JWT secret key is not defined');
    }

    try {
      const { payload } = await jwtVerify(token, secretKey);
      return payload as unknown as IAccessTokenPayload;
    } catch {
      console.error(' Token verification failed');
      return null;
    }
  }

  private static async signAccessTokenWithJWT(payload: IAccessTokenPayload): Promise<string> {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) throw new Error('JWT secret key is not defined');
    const key = new TextEncoder().encode(secretKey);
    const jwtPayload = payload as unknown as JWTPayload;
    const token = await new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .sign(key);

    return token;
  }
}
