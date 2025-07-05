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
      html:  `
      <div style="max-width:480px; margin:0 auto; border:1px solid #eaeaea; border-radius:8px; padding:32px 24px; background:#fafbfc; font-family:'Apple SD Gothic Neo', Arial, sans-serif;">
        <div style="text-align:center; margin-bottom:24px;">
          <!-- 회사 로고 (URL을 실제 로고로 교체) -->
          <img src="https://velog.velcdn.com/images/prkty/post/7a178b67-dfcd-4315-a02f-d698f3b36c36/image.png" alt="CodePlanner 로고" style="height:80px;"/>
        </div>
        <h2 style="color:#222; margin-bottom:16px;">CodePlanner 회원가입 인증 안내</h2>
        <p style="color:#444; font-size:15px; margin-bottom:24px;">
          안녕하세요, CodePlanner입니다.<br/>
          저희 서비스를 이용해주셔서 진심으로 감사드립니다.<br/>
          아래 버튼을 클릭하시면 회원가입 인증이 완료됩니다.
        </p>
        <div style="text-align:center; margin-bottom:32px;">
          <a href="${url}" target="_blank" style="padding:12px 28px; background:#28a745; color:#fff; text-decoration:none; border-radius:4px; font-size:16px; font-weight:bold;">
            가입 확인하기
          </a>
        </div>
        <p style="color:#888; font-size:13px;">
          본 메일은 CodePlanner 회원가입을 위해 발송된 안내 메일입니다.<br/>
          만약 본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.
        </p>
        <hr style="margin:32px 0 16px 0; border:none; border-top:1px solid #eee;">
        <div style="color:#aaa; font-size:12px; text-align:center;">
          © 2025 CodePlanner. All rights reserved.<br/>
        </div>
      </div>
    `,
    };

    return await this.transporter.sendMail(mailOptions);
  }
}
