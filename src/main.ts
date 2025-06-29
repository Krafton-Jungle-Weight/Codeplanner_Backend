import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // CORS 설정 - React 프론트엔드(포트 3000)에서 접근 허용
  app.enableCors({
    origin: 'http://localhost:3000', // React 앱 주소
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 5000); // 백엔드 포트를 5000으로 설정
  console.log(`🚀 Listening on ${process.env.PORT ?? 5000}`);
}
bootstrap();