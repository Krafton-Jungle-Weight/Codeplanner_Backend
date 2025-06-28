import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// JWT 인증 가드
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    console.log('token', token);
    if (!token) {
      throw new UnauthorizedException('JWT 토큰이 필요합니다.');
    }

    // JWT 토큰 검증
    try {
      // JWT 토큰 검증 및 추출 정보 얻어오기기
      const payload = await this.jwtService.verifyAsync(token);
      console.log('JWT Payload:', payload); // 디버깅용 로그
      // 요청 객체에 사용자 정보를 추가
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않은 JWT 토큰입니다.');
    }
  }

  // JWT 토큰 추출
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return token;
  }
}
