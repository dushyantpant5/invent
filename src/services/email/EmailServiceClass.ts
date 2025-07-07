interface SendEmailParams {
  toEmail: string;
  otp: string;
}

export class EmailServiceClass {
  private serviceID: string;
  private templateID: string;
  private userID: string;

  constructor({
    serviceID,
    templateID,
    userID,
  }: {
    serviceID: string;
    templateID: string;
    userID: string;
  }) {
    this.serviceID = serviceID;
    this.templateID = templateID;
    this.userID = userID;
  }

  // async sendOtpEmail({ toEmail, otp }: SendEmailParams): Promise<void> {
  //   await emailjs.send(
  //     this.serviceID,
  //     this.templateID,
  //     {
  //       email: toEmail,
  //       passcode: otp,
  //     },
  //     this.userID
  //   );
  // }
}
