import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { EmailInvitationToken } from './email-invitation-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, EmailInvitationToken])],
  providers: [EmailService],
  exports: [EmailService],
}) 
export class EmailModule {}
