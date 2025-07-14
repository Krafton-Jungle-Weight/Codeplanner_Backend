import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DatabaseModule } from 'src/database/database.module';
import { User } from './user.entity';
import { EmailVerificationToken } from 'src/email/email.entity';
import { GithubToken } from 'src/github/github.entity';
import { EmailModule } from 'src/email/email.module';

// 인증 모듈
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthModule } from 'src/auth/auth.module';

//회원탈퇴용
import { ProjectMember } from 'src/project/project-member.entity';
import { UserNotification } from 'src/notification/user-notification.entity';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User, EmailVerificationToken, GithubToken, ProjectMember, UserNotification]),
    AuthModule,
    EmailModule,
  ],
  controllers: [UserController],
  providers: [UserService, JwtAuthGuard], // JwtAuthGuard 인증 가드 사용
  exports: [UserService], // UserService export 추가
})
export class UserModule {}
