import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// 현재 사용자 정보 추출 데코레이터
export const CurrentUser = createParamDecorator(
  // 현재 사용자 정보 추출
  (data: unknown, ctx: ExecutionContext) => {
    // 요청 객체에서 사용자 정보 추출
    const request = ctx.switchToHttp().getRequest();
    // 사용자 정보 반환
    return request.user;
  },
);
