import {
  Body,
  Controller,
  Post,
  Res,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-auth.dto';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
      },
    });
  }

  @Post('/logout')
  async logout(@Res() res: Response) {
    res.clearCookie('jwtToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: '로그아웃 성공' });
  }
}
