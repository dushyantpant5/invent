import emailjs from 'emailjs-com';

interface SendEmailParams {
  toEmail: string;
  otp: string;
}

export async function sendOtpEmail({ toEmail, otp }: SendEmailParams): Promise<void> {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const userId = process.env.NEXT_PUBLIC_EMAILJS_USER_ID;

  if (!serviceId || !templateId || !userId) {
    throw new Error('EmailJS environment variables are not configured');
  }

  try {
    const result = await emailjs.send(
      serviceId,
      templateId,
      { email: toEmail, passcode: otp },
      userId
    );
    console.log('Email sent:', result.status, result.text);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw error;
  }
}
