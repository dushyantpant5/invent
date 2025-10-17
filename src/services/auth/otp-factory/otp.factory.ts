export class OtpFactory {
  static generateOtp(): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
  }

  static async generateOtpHash(otp: string): Promise<string> {
    if (!otp) {
      throw new Error('OTP cannot be empty');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(otp);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  }

  static async verifyOtp(plainOtp: string, hashedOtp: string): Promise<boolean> {
    if (!plainOtp || !hashedOtp) {
      throw new Error('Plain OTP and hashed OTP are required for verification');
    }

    const hashedPlainOtp = await this.generateOtpHash(plainOtp);
    return hashedPlainOtp === hashedOtp;
  }
}
