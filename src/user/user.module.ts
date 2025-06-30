import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { EmailService } from 'src/email/email.service';
import { DatabaseModule } from 'src/database/database.module';
import { User } from './user.entity';
import { EmailVerificationToken } from 'src/email/email.entity';

// 인증 모듈
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User, EmailVerificationToken]),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, EmailService, JwtAuthGuard], // JwtAuthGuard 인증 가드 사용
})
export class UserModule {}
