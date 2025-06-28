import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

// JWT 인증 가드
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    // 1. JWT 토큰 먼저 시도
    const jwtToken = this.extractJwtToken(request);
    if (jwtToken) {
      try {
        const payload = await this.jwtService.verifyAsync(jwtToken);
        console.log('JWT Token valid:', payload);
        request['user'] = payload;
        return true;
      } catch (error) {
        console.log('JWT Token expired or invalid, trying refresh token...');
      }
    }

    // 2. JWT 토큰이 없거나 만료된 경우, Refresh 토큰으로 새 JWT 생성
    const refreshToken = this.extractRefreshToken(request);
    if (refreshToken) {
      try {
        const payload = await this.jwtService.verifyAsync(refreshToken);
        console.log('Refresh Token valid, generating new JWT token');

        // 새로운 JWT 토큰 생성
        const newJwtToken = this.jwtService.sign(
          {
            id: payload.id,
            email: payload.email,
            display_name: payload.display_name,
          },
          {
            secret: 'your-secret-key-here',
            expiresIn: '1h',
          },
        );

        // 새로운 JWT 토큰을 쿠키에 설정
        response.cookie('jwtToken', newJwtToken, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 1000, // 1시간
        });

        request['user'] = payload;
        return true;
      } catch (error) {
        console.log('Refresh Token also expired or invalid');
      }
    }

    throw new UnauthorizedException('유효한 토큰이 없습니다.');
  }

  // JWT 토큰 추출
  private extractJwtToken(request: Request): string | undefined {
    // 1. Authorization 헤더에서 토큰 추출
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      console.log('JWT Token from Authorization header');
      return token;
    }

    // 2. 쿠키에서 JWT 토큰 추출
    const cookies = request.headers.cookie;
    if (cookies) {
      const jwtCookie = cookies
        .split(';')
        .find((cookie) => cookie.trim().startsWith('jwtToken='));
      if (jwtCookie) {
        const token = jwtCookie.split('=')[1];
        console.log('JWT Token from cookie');
        return token;
      }
    }

    return undefined;
  }

  // Refresh 토큰 추출
  private extractRefreshToken(request: Request): string | undefined {
    const cookies = request.headers.cookie;
    if (cookies) {
      const refreshCookie = cookies
        .split(';')
        .find((cookie) => cookie.trim().startsWith('refreshToken='));
      if (refreshCookie) {
        const token = refreshCookie.split('=')[1];
        console.log('Refresh Token from cookie');
        return token;
      }
    }
    return undefined;
  }
}
