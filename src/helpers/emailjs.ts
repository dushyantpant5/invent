// This is just used for testing purposes, this will be removed later as we will use the EmailService and  EmailServiceClass
import emailjs from 'emailjs-com';

interface SendEmailParams {
  toEmail: string;
  otp: string;
}

export async function sendOtpEmail({ toEmail, otp }: SendEmailParams): Promise<void> {
  try {
    const result = await emailjs.send(
      'service_tcfnna5',
      'template_vw7lzpr',
      {
        email: toEmail,
        passcode: otp,
      },
      'KJEBx3PbN3FjIVI50'
    );

    console.log('Email sent:', result.status, result.text);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw error;
  }
}
