import { Injectable } from '@nestjs/common';

import * as Mail from 'nodemailer/lib/mailer';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private transporter: Mail;
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'myong2404@gmail.com',
        pass: 'uzas jmpi wfks ikvh',
      },
    });
  }

  async sendMemberJoinVerification(
    emailAddress: string,
    signupVerifyToken: string,
  ) {
    // 이 링크를 통해
    const corsOrigin = process.env.CORS_ORIGIN?.split(',')[0];
    const baseUrl = `${corsOrigin}`;
    const url = `${baseUrl}/auth/emailVerified?email=${emailAddress}&verifyToken=${signupVerifyToken}`;

    const mailOptions: EmailOptions = {
      to: emailAddress,
      subject: '가입 인증 메일 발송',
      html: `
        가입확인 버튼를 누르시면 가입 인증이 완료됩니다.<br/>
        <a href="${url}" target="_blank" style="padding:8px 16px;
      background:#28a745; color:#fff; text-decoration:none;
      border-radius:4px;">
      가입 확인하기
    </a>
      `,
    };

    return await this.transporter.sendMail(mailOptions);
  }
}
