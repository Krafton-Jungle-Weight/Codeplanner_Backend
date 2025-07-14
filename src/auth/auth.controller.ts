import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-auth.dto';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from 'src/auth/user.decorator';
import { GithubOauthDto } from './dto/github-oauth.dto';
import axios from 'axios';
import { GithubToken } from 'src/github/github.entity';
import { EmailService } from 'src/email/email.service';
import { VerifyResetTokenDto } from './dto/verify-reset-token.dto';
import { EmailVerificationToken } from 'src/email/email.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(GithubToken)
    private githubTokenRepository: Repository<GithubToken>,
    private readonly emailService: EmailService,
    @InjectRepository(EmailVerificationToken)
    private emailVerificationTokenRepository: Repository<EmailVerificationToken>,
  ) {}

  @Post('/login')
  async login(@Body() input: LoginUserDto, @Res() res: Response) {
    const { email, password } = input;

    const user = await this.userRepository.findOneBy({ email });

    // 만약 이메일이 없다면
    if (!user) {
      throw new UnprocessableEntityException('이메일이 없습니다. ');
    }
    if (email === 'deleted') {
      throw new UnprocessableEntityException('이미 삭제된 유저입니다.');
    }
    const isAuth = await bcrypt.compare(password, user.password_hash);

    if (!isAuth) {
      throw new UnprocessableEntityException('비밀번호가 일치하지 않습니다.');
    }

    this.authService.setRefrashToken({ user, res });
    console.log('user id', user.id);
    const jwt = this.authService.getAccessToken({ user, res });

    return res.status(200).json({
      message: '로그인 성공',
      accessToken: jwt,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        is_verified: user.is_verified,
      },
    });
  }

  @Post('/logout')
  async logout(@Res() res: Response) {
    res.clearCookie('jwtToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: '로그아웃 성공' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('/github-oauth')
  async githubOauth(
    @Body() input: GithubOauthDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const code = input.code;
    const client_id = process.env.GITHUB_CLIENT_ID;
    const client_secret = process.env.GITHUB_CLIENT_SECRET;
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      { client_id, code, client_secret },
      { headers: { Accept: 'application/json' } },
    );
    console.log('response', tokenResponse.data);
    const userId = user.id;
    console.log('userId', userId);
    const githubToken = new GithubToken();
    githubToken.user_id = userId;
    githubToken.provider = 'github';
    githubToken.provider_user_id = user.email;
    githubToken.access_token = tokenResponse.data.access_token;
    githubToken.connected_at = new Date();

    // 깃허브 유저 정보 가져오기
    const userInfoResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${githubToken.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    const githubUser = userInfoResponse.data;
    githubToken.github_login = githubUser.login;
    githubToken.github_id = githubUser.id ? githubUser.id.toString() : undefined;

    await this.githubTokenRepository.save(githubToken);
    return res.status(200).json({
      message: '깃허브 로그인 성공',
    });
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() input: { email: string }, @Res() res: Response){
    const { email } = input;
    const token = await this.authService.generateNewPasswordToken(email);
    const result = await this.emailService.sendNewPasswordEmail(email, token);
    return res.status(200).json({
      message: '비밀번호 재설정 이메일 발송 완료',
    });
  }

  @Post('/verify-reset-token')
  async verifyResetToken(@Body() input: VerifyResetTokenDto, @Res() res: Response){
    const { email, token } = input;
    const isValid = await this.authService.verifyToken(email, token);
    if(!isValid){
      throw new UnprocessableEntityException('유효하지 않은 토큰입니다.');
    }
    await this.emailVerificationTokenRepository.delete({
      email: email,
      verification_code: token,
    });
    return res.status(200).json({
      message: '토큰 검증 성공',
    });
  }

  @Post('/reset-password')
  async resetPassword(@Body() input: LoginUserDto, @Res() res: Response){
    const { email, password } = input;
    const user = await this.userRepository.findOneBy({ email });
    if(!user){
      throw new UnprocessableEntityException('존재하지 않는 이메일입니다.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepository.update({ email: email }, { password_hash: hashedPassword });
    return res.status(200).json({
      message: '비밀번호 재설정 완료',
    });
  }
}
