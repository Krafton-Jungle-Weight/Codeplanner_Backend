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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(GithubToken)
    private githubTokenRepository: Repository<GithubToken>,
  ) {}

  @Post('/login')
  async login(@Body() input: LoginUserDto, @Res() res: Response) {
    const { email, password } = input;

    const user = await this.userRepository.findOneBy({ email });

    // 만약 이메일이 없다면
    if (!user) {
      throw new UnprocessableEntityException('이메일이 없습니다. ');
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
    await this.githubTokenRepository.save(githubToken);
    return res.status(200).json({
      message: '깃허브 로그인 성공',
    });
  }
}
