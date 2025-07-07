import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as uuid from 'uuid';
import { EmailVerificationToken } from 'src/email/email.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService,

    @InjectRepository(EmailVerificationToken)
    private emailVerificationTokenRepository: Repository<EmailVerificationToken>,
  ) {}

  getAccessToken({ user, res }) {
    const accessToken = this.jwtService.sign(
      {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
      },
      {
        secret: 'your-secret-key-here', // 고정된 secret 사용(배포환경에서는 환경변수로 설정)
        expiresIn: '1h',
      },
    );

    // JWT 토큰을 쿠키로 설정
    res.cookie('jwtToken', accessToken, {
      httpOnly: true,
      secure: false, // 개발환경에서는 false
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1시간
    });

    return accessToken;
  }

  setRefrashToken({ user, res }) {
    const refreshToken = this.jwtService.sign(
      {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
      },
      {
        secret: 'your-secret-key-here', // 고정된 secret 사용 (배포환경에서는 환경변수로 설정)
        expiresIn: '1w',
      },
    );

    // Refresh 토큰을 쿠키로 설정
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // 개발환경에서는 false, 프로덕션에서는 true
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1주일
    });

    return refreshToken;
  }

  async generateNewPasswordToken(email: string) {
    // 5글자짜리 영어(대소문자)와 숫자로 이루어진 토큰 생성
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 5; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    await this.emailVerificationTokenRepository.save({
      email: email,
      verification_code: token,
      expires_at: new Date(Date.now() + 3 * 60 * 1000),
    });
    return token;
  }

  // 사용자가 입력한 5글자 토큰이 DB에 저장된 토큰과 일치하는지 확인하는 함수
  async verifyToken(email: string, inputToken: string) {
    // DB에서 해당 이메일과 토큰이 일치하는 레코드 조회 (만료시간도 체크)
    const tokenRecord = await this.emailVerificationTokenRepository.findOneBy({
      email: email,
      verification_code: inputToken,
    });

    if (!tokenRecord) {
      // 토큰이 없거나 일치하지 않음
      return false;
    }

    // 토큰 만료 확인
    if (tokenRecord.expires_at < new Date()) {
      // 토큰이 만료됨
      return false;
    }

    // 토큰이 일치하고 만료되지 않음
    return true;
  }
}
