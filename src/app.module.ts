import { Module } from '@nestjs/common';
import { AppController } from './modules/app/app.controller';
import { AppService } from './modules/app/app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { EmailController } from './email/email.controller';
import { EmailModule } from './email/email.module';
import { DatabaseModule } from './database/database.module';
import { IssuesModule } from './issues/issues.module';
import { TimelineModule } from './timeline/timeline.module';

@Module({
  imports: [UserModule, AuthModule, EmailModule, DatabaseModule, IssuesModule, TimelineModule],
  controllers: [AppController, EmailController],

  providers: [AppService],
})
export class AppModule {}