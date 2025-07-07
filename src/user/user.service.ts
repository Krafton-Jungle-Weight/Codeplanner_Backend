import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VerifyEmailDto } from 'src/email/dto/verify-email.dto';
import { EmailService } from 'src/email/email.service';
import * as uuid from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from 'src/user/user.entity';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { EmailVerificationToken } from 'src/email/email.entity';

@Injectable()
export class UserService {
  constructor(
    // 이메일 서비스
    private emailService: EmailService,

    // 유저 저장
    @InjectRepository(User)
    private userRepository: Repository<User>,

    // 이메일 인증 토큰 저장
    @InjectRepository(EmailVerificationToken)
    private emailVerificationTokenRepository: Repository<EmailVerificationToken>,
  ) {}

  PASSWORD_SALT = 10;

  // 유저 생성
  async createUser(input: CreateUserDto) {
    const { email, display_name, password, password_again, auth_provider } =
      input;
    await this.checkUserExists(email);

    if (password !== password_again) {
      throw new BadRequestException('비밀번호가 일치하지 않습니다.');
    }
    const hashedPassword = await bcrypt.hash(
      input.password,
      this.PASSWORD_SALT,
    );
    const signupVerifyToken = uuid.v1();

    await this.saveUser(
      display_name,
      email,
      hashedPassword,
      auth_provider || 'local',
    );

    await this.saveEmailVerificationToken(email, signupVerifyToken);
    await this.sendMemberJoinEmail(email, signupVerifyToken);
  }

  // 이메일 인증 토큰 저장
  private async saveEmailVerificationToken(email: string, token: string) {
    const result = await this.emailVerificationTokenRepository.save({
      email,
      verification_code: token,
      // 10분 후 만료
      expires_at: new Date(Date.now() + 1000 * 60 * 10),
    });
    return result;
  }

  // 유저 존재 여부 확인
  private async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ email });
    if (user) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }
    return true;
  }

  // 유저 저장
  private async saveUser(
    display_name: string,
    email: string,
    hashedPassword: string,
    auth_provider: string,
  ) {
    const result = await this.userRepository.save({
      email,
      display_name,
      password_hash: hashedPassword,
      is_verified: false,
      auth_provider,
    });
    return result;
  }

  // 이메일 인증 이메일 발송
  private async sendMemberJoinEmail(email: string, signupVerifyToken: string) {
    await this.emailService.sendMemberJoinVerification(
      email,
      signupVerifyToken,
    );
  }

  // 이메일 인증 이메일 재발송
  async resendJoinEmail(email: string) {
    console.log('resendJoinEmail : ', email);
    const signupVerifyToken = uuid.v1();
    const user = await this.userRepository.findOneBy({ email: email });
    if (!user) {
      throw new BadRequestException('존재하지 않는 이메일입니다.');
    }
    if (user.is_verified) {
      throw new BadRequestException('이미 인증된 이메일입니다. : ' + email);
    }
    await this.saveEmailVerificationToken(email, signupVerifyToken);
    await this.emailService.sendMemberJoinVerification(
      email,
      signupVerifyToken,
    );
  }

  // 이메일 인증
  async verifyEmail(email: string, verifyToken: string) {
    console.log('verifyEmail : ', email);
    console.log('Token', verifyToken);
    const emailVerificationToken =
      await this.emailVerificationTokenRepository.findOneBy({
        email: email,
        verification_code: verifyToken,
      });
    if (!emailVerificationToken) {
      throw new BadRequestException('이메일 인증 토큰이 일치하지 않습니다.');
    }
    if (emailVerificationToken.expires_at < new Date()) {
      throw new BadRequestException('이메일 인증 토큰이 만료되었습니다.');
    }
    console.log('삭제 시도:', { email: email, verification_code: verifyToken });
    const result = await this.emailVerificationTokenRepository.delete({
      email: email,
      verification_code: verifyToken,
    });
    console.log('Delete result:', result);
    await this.userRepository.update({ email: email }, { is_verified: true });
    return;
  }

  // 마이페이지
  async myPage(id: string) {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new BadRequestException('존재하지 않는 유저입니다.');
    }
    return user;
  }

  // 마이페이지 업데이트
  async updateDisplayName(id: string, displayName: string) {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new BadRequestException('존재하지 않는 유저입니다.');
    }
    await this.userRepository.update({ id: id }, { display_name: displayName });
    return { message: '닉네임 변경 완료' };
  }

  // 이메일 인증 여부 확인
  async isVerified(id: string) {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new BadRequestException('존재하지 않는 유저입니다.');
    }
    return user.is_verified;
  }

  // 전체 유저 목록 조회 (팀원 초대용)
  async getAllUsers() {
    return this.userRepository.find({
      select: ['id', 'email', 'display_name'],
    });
  }

  // id로 유저 찾기
  async getUserByIdForIssue(id: string) {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new BadRequestException('존재하지 않는 유저입니다.');
    }
    return { id: user.id, displayName: user.display_name };
  }








  
}

