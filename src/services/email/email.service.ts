// // This is not used rightnow , its a placeholder for future use
// import { ServiceError } from '../lib';
// import { EmailServiceClass } from './EmailServiceClass';

// interface EmailOtpDto {
//   toEmail: string;
//   otp: string;
// }

// export class EmailService {
//   static async sendOtpEmail(data: EmailOtpDto): Promise<void> {
//     const { toEmail, otp } = data;

//     console.log('Sending OTP Email to:', toEmail, 'with OTP:', otp);
//     console.log('Using Email Service Config:', {
//       serviceID: process.env.EMAIL_SERVICE_ID,
//       templateID: process.env.EMAIL_TEMPLATE_ID,
//       userID: process.env.EMAIL_USER_ID,
//     });

//     const _emailServiceInstance = new EmailServiceClass({
//       serviceID: process.env.EMAIL_SERVICE_ID as string,
//       templateID: process.env.EMAIL_TEMPLATE_ID as string,
//       userID: process.env.EMAIL_USER_ID as string,
//     });
//     try {
//       await _emailServiceInstance.sendOtpEmail({ toEmail, otp });
//     } catch (error) {
//       console.error('Failed to send OTP email:', error);
//       throw new ServiceError('Failed to send OTP email');
//     }
//   }
// }
