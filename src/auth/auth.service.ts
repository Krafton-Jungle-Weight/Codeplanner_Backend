import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  getAccessToken({ user }): string {
    return this.jwtService.sign(
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

    // 배포환경에서 쿠키 보안옵션과 CORS 추가
    res.setHeader('Set-Cookie', `refreshToken=${refreshToken}`);
    return;
  }
}
