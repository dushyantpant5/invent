import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';

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
    const raw = randomBytes(64).toString('hex');
    return new Token(raw);
  }

  static getRefreshTokenHash(token: Token): Token {
    if (!(token instanceof Token)) {
      throw new Error('Invalid token instance');
    }

    const hashed = createHash('sha256').update(token.tokenValue).digest('hex');
    return new Token(hashed);
  }

  private static signAccessTokenWithJWT(payload: IAccessTokenPayload): string {
    const secretKey: string | undefined = process.env.JWT_SECRET;

    if (!secretKey) {
      throw new Error('JWT secret key is not defined');
    }

    return jwt.sign(payload, secretKey);
  }
}
