import { Injectable } from '@nestjs/common';

import * as Mail from 'nodemailer/lib/mailer';
import * as nodemailer from 'nodemailer';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private transporter: Mail;

  @InjectRepository(User)
  private userRepository: Repository<User>;
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'myong2404@gmail.com',
        pass: 'vviu hmcq jgif gagg',
      },
    });
  }
 
  async sendIssueAllocateEmail(
    assigneeId,
    issueTitle: string,
    projectId: string,
  ) {
    const baseUrl = process.env.BASE_URL;
    const url = `${baseUrl}/projects/${projectId}/board`;
    console.log(url);

    const user = await this.userRepository.findOne({
      where: { id: assigneeId },
    });
    const emailAddress = user?.email;

    const mailOptions: EmailOptions = {
      to: emailAddress ?? '',
      subject: '이슈 할당 알림',
      html: `
        <h1>이슈 할당 알림</h1>
        <p>이슈가 할당되었습니다.</p>
        <p>이슈 제목: ${issueTitle}</p>
        <p>이슈 링크: <a href="${url}">${url}</a></p>
      `,
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendMemberJoinVerification(
    emailAddress: string,
    signupVerifyToken: string,
  ) {
    // 이 링크를 통해
    const baseUrl = process.env.BASE_URL;
    const url = `${baseUrl}/auth/emailVerified?email=${emailAddress}&verifyToken=${signupVerifyToken}`;
    console.log(url);

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
