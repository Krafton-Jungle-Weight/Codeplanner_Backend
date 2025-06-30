import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

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
}
