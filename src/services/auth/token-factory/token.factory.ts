import jwt from 'jsonwebtoken';

import { Token } from './token.class';

interface IAccessTokenPayload {
  id: string;
  email: string;
}

export class TokenFactory {
  static getAccessToken(payload: IAccessTokenPayload): Token {
    if (!payload?.id || !payload.email) {
      throw new Error('Invalid payload for access token');
    }

    const tokenValue: string = this.signAccessTokenWithJWT(payload);
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

  static verifyAccessToken(token: string): IAccessTokenPayload {
    const secretKey: string | undefined = process.env.JWT_SECRET;

    if (!secretKey) {
      throw new Error('JWT secret key is not defined');
    }

    try {
      const decoded = jwt.verify(token, secretKey) as IAccessTokenPayload;
      return decoded;
    } catch {
      throw new Error('Invalid access token');
    }
  }

  private static signAccessTokenWithJWT(payload: IAccessTokenPayload): string {
    const secretKey: string | undefined = process.env.JWT_SECRET;

    if (!secretKey) {
      throw new Error('JWT secret key is not defined');
    }

    return jwt.sign(payload, secretKey);
  }
}
