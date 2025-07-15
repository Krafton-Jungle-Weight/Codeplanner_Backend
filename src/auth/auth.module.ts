import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/user/user.entity';
import { EmailVerificationToken } from 'src/email/email.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GithubToken } from 'src/github/github.entity';
import { EmailModule } from 'src/email/email.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    JwtModule.register({
      secret: 'your-secret-key-here',
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([User, EmailVerificationToken, GithubToken]),
    EmailModule,
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule],
})
export class AuthModule {}
