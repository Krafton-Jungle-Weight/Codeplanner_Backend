// ⚠️⚠️⚠️배포환경 관련 설정 주의 필요!!!⚠️⚠️⚠️

import * as crypto from 'crypto';
// crypto 모듈을 전역으로 설정
if (!(global as any).crypto) {
  (global as any).crypto = crypto.webcrypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  // 모든 라우트에 /api 프리픽스 적용
  // app.setGlobalPrefix('api');

  // .env에서 CORS_ORIGIN을 불러와서 배열로 변환
  const corsOrigin = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];  // 개발 환경시: http://localhost:3000, 배포 환경시: 배포 주소
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 5000;  // 백엔드 포트를 5000으로 설정
  await app.listen(port);
  console.log(`🚀 Listening on ${port}`);
}
bootstrap();