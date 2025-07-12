// ⚠️⚠️⚠️배포환경 관련 설정 주의 필요!!!⚠️⚠️⚠️

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './modules/app/app.controller';
import { AppService } from './modules/app/app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { EmailController } from './email/email.controller';
import { EmailModule } from './email/email.module';
import { DatabaseModule } from './database/database.module';
import { IssuesModule } from './issues/issues.module';
import { TimelineModule } from './timeline/timeline.module';
import { SummaryModule } from './summary/summary.module';
import { GithubModule } from './github/github.module';
import { AnalysisModule } from './analysis/analysis.module';
// import { WebhookModule } from './analysis/webhook/webhook.module';
import { AimodelModule } from './aimodel/aimodel.module';
import { NotificationModule } from './notification/notification.moduel';
import { CommentModule } from './comments/comment.module';
import { ActivityModule } from './activity/activity.module';
import { LogHeadersMiddleware } from './common/middleware/log-headers.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.development', // 개발 환경시: .env.development 파일 사용, 배포 환경시: .env.production 파일 사용
    }),
    UserModule,
    AuthModule,
    EmailModule,
    DatabaseModule,
    IssuesModule,
    TimelineModule,
    SummaryModule,
    GithubModule,
    AnalysisModule,
    // WebhookModule,
    AimodelModule,
    NotificationModule,
    CommentModule,
    ActivityModule,
  ],
  controllers: [AppController, EmailController],

  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogHeadersMiddleware).forRoutes('*');
  }
}
