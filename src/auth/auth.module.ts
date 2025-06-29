import { Module } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/user/user.entity';
import { EmailVerificationToken } from 'src/email/email.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    JwtModule.register({
      secret: 'your-secret-key-here',
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([User, EmailVerificationToken]),
  ],
  controllers: [AuthController],
  providers: [EmailService, AuthService, UserService],
  exports: [JwtModule],
})
export class AuthModule {}
