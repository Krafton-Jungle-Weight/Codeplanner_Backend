import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    // 1) 프론트(3000) + 백엔드 테스트(3001) 모두 허용
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 5000);
  console.log(`🚀 Listening on ${process.env.PORT ?? 5000}`);
}
bootstrap();
