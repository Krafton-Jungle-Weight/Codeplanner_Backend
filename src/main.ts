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

  // CORS 설정 - Auto Scaling 환경을 고려한 유연한 설정
  const corsOrigin = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
  
  // Auto Scaling 환경에서 동적으로 변경되는 IP를 처리하기 위한 설정
  const allowedOrigins = [
    ...corsOrigin,
    'https://code-planner.com',  // 메인 도메인
    'http://code-planner.com',   // HTTP 메인 도메인
  ];

  // 개발 환경에서는 모든 origin 허용 (필요시 제거)
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000');
  }

  app.enableCors({
    origin: function (origin, callback) {
      // origin이 없는 경우 (같은 origin에서의 요청) 허용
      if (!origin) return callback(null, true);
      
      // 허용된 origin 목록에 있거나, AWS EC2 IP 범위인 경우 허용
      if (allowedOrigins.includes(origin) || 
          origin.match(/^http:\/\/3\.\d+\.\d+\.\d+:3000$/) ||  // AWS EC2 IP 패턴
          origin.match(/^https?:\/\/.*\.amazonaws\.com/)) {   // AWS 도메인
        return callback(null, true);
      }
      
      console.log(`🚫 CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
  });

  const port = process.env.PORT || 5000;  // 백엔드 포트를 5000으로 설정
  await app.listen(port);
  console.log(`🚀 Listening on ${port}`);
  console.log(`🌐 CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`🔧 Auto Scaling CORS enabled for EC2 IPs`);
}
bootstrap();