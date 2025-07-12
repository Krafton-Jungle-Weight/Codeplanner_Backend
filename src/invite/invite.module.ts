import { Module } from '@nestjs/common';
import { InviteController } from './invite.controller';
import { EmailModule } from 'src/email/email.module';
import { ProjectModule } from 'src/project/project.module';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [EmailModule, ProjectModule, UserModule, AuthModule],
  controllers: [InviteController],
})
export class InviteModule {} 