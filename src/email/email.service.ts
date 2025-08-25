import { Injectable } from '@nestjs/common';

import * as Mail from 'nodemailer/lib/mailer';
import * as nodemailer from 'nodemailer';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailInvitationToken } from './email-invitation-token.entity';
import { v4 as uuidv4 } from 'uuid';
import { SentMessageInfo, Transporter } from 'nodemailer'; // 1. Transporter를 여기서 import 합니다.

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  // 2. transporter의 타입을 Transporter<SentMessageInfo>로 명확하게 지정합니다.
  private transporter: Transporter<SentMessageInfo>;

  @InjectRepository(User)
  private userRepository: Repository<User>;

  @InjectRepository(EmailInvitationToken)
  private invitationTokenRepository: Repository<EmailInvitationToken>;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_APP_MAIL,
        pass: process.env.GMAIL_APP_KEY,
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

  async sendNewPasswordEmail(email: string, token: string) {
    console.log('email', email);
    const baseUrl = process.env.BASE_URL;
    const url = `${baseUrl}/auth/reset-password?email=${email}&token=${token}`;
    const mailOptions: EmailOptions = {
      to: email,
      subject: '비밀번호 재설정 안내',
      html: `
        <div style="max-width:480px; margin:0 auto; border:1px solid #eaeaea; border-radius:8px; padding:32px 24px; background:#fafbfc; font-family:'Apple SD Gothic Neo', Arial, sans-serif;">
        <div style="text-align:center; margin-bottom:24px;">
          <!-- 회사 로고 (URL을 실제 로고로 교체) -->
          <img src="https://velog.velcdn.com/images/prkty/post/7a178b67-dfcd-4315-a02f-d698f3b36c36/image.png" alt="CodePlanner 로고" style="height:80px;"/>
        </div>
        <h2 style="color:#222; margin-bottom:16px;">CodePlanner 비밀번호 재설정 안내</h2>
        <p style="color:#444; font-size:15px; margin-bottom:24px;">
          안녕하세요, CodePlanner입니다.<br/>
          저희 서비스를 이용해주셔서 진심으로 감사드립니다.<br/>
          아래 버튼을 클릭하시면 비밀번호 재설정 페이지로 이동합니다.
        </p>
        <div style="text-align:center; margin-bottom:32px;">
          <a href="${url}" target="_blank" style="padding:12px 28px; background:#28a745; color:#fff; text-decoration:none; border-radius:4px; font-size:16px; font-weight:bold;">
            비밀번호 재설정하기
          </a>
        </div>
        <p style="color:#888; font-size:13px;">
          본 메일은 CodePlanner 비밀번호 재설정을 위해 발송된 안내 메일입니다.<br/>
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

  // 초대 토큰 생성
  async createInvitationToken(email: string, projectId: string, role: string): Promise<string> {
    console.log('createInvitationToken 호출됨:', { email, projectId, role, projectIdType: typeof projectId });
    
    // 기존 토큰이 있다면 삭제
    await this.invitationTokenRepository.delete({ 
      email, 
      project_id: projectId 
    });

    // 새 토큰 생성 (UUID + 랜덤 숫자)
    const verificationCode = uuidv4().substring(0, 8) + Math.floor(Math.random() * 100);
    
    // 7일 후 만료
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = this.invitationTokenRepository.create({
      email,
      verification_code: verificationCode,
      expires_at: expiresAt,
      project_id: projectId,
      role: role,
    });

    console.log('토큰 생성 전 데이터:', token);

    await this.invitationTokenRepository.save(token);
    return verificationCode;
  }

  // 초대 이메일 발송
  async sendProjectInvitationEmail(
    email: string,
    projectName: string,
    inviterName: string,
    role: string,
    token: string,
  ): Promise<void> {
    const baseUrl = process.env.BASE_URL;
    const inviteUrl = `${baseUrl}/invite?token=${token}`;

    const roleDisplayName = {
      'ADMIN': '관리자',
      'MEMBER': '멤버',
      'VIEWER': '뷰어',
    }[role] || role;

    const mailOptions: EmailOptions = {
      to: email,
      subject: `[CodePlanner] ${projectName} 프로젝트 초대`,
      html: `
        <div style="max-width:480px; margin:0 auto; border:1px solid #eaeaea; border-radius:8px; padding:32px 24px; background:#fafbfc; font-family:'Apple SD Gothic Neo', Arial, sans-serif;">
          <div style="text-align:center; margin-bottom:24px;">
            <img src="https://velog.velcdn.com/images/prkty/post/7a178b67-dfcd-4315-a02f-d698f3b36c36/image.png" alt="CodePlanner 로고" style="height:80px;"/>
          </div>
          <h2 style="color:#222; margin-bottom:16px;">프로젝트 참여 초대</h2>
          <p style="color:#444; font-size:15px; margin-bottom:24px;">
            안녕하세요!<br/>
            <strong>${inviterName}</strong>님이 CodePlanner의 <strong>${projectName}</strong> 프로젝트에 초대하셨습니다.<br/>
            역할: <span style="color:#007bff; font-weight:bold;">${roleDisplayName}</span>
          </p>
          <div style="text-align:center; margin-bottom:32px;">
            <a href="${inviteUrl}" target="_blank" style="padding:12px 28px; background:#007bff; color:#fff; text-decoration:none; border-radius:4px; font-size:16px; font-weight:bold;">
              초대 수락하기
            </a>
          </div>
          <p style="color:#888; font-size:13px;">
            • 초대 링크는 7일간 유효합니다.<br/>
            • 만약 본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.<br/>
            • 링크를 클릭하면 프로젝트 참여 여부를 선택할 수 있습니다.
          </p>
          <hr style="margin:32px 0 16px 0; border:none; border-top:1px solid #eee;">
          <div style="color:#aaa; font-size:12px; text-align:center;">
            © 2025 CodePlanner. All rights reserved.
          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  // 토큰 검증
  async verifyInvitationToken(token: string): Promise<EmailInvitationToken | null> {
    const invitation = await this.invitationTokenRepository.findOne({
      where: { verification_code: token },
    });

    if (!invitation) {
      return null;
    }

    // 만료 확인
    if (new Date() > invitation.expires_at) {
      // 만료된 토큰 삭제
      await this.invitationTokenRepository.delete({ id: invitation.id });
      return null;
    }

    return invitation;
  }

  // 토큰 사용 완료 후 삭제
  async deleteInvitationToken(tokenId: string): Promise<void> {
    await this.invitationTokenRepository.delete({ id: tokenId });
  }

}
