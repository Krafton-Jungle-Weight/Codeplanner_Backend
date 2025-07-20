import { Module } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { SummaryController } from './summary.controller';
import { ProjectMember } from 'src/project/project-member.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

// 인증 모듈
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthModule } from 'src/auth/auth.module';
import { IssuesModule } from 'src/issues/issues.module';

@Module({
  providers: [SummaryService, JwtAuthGuard],
  controllers: [SummaryController],
  imports: [
    TypeOrmModule.forFeature([ProjectMember]),
    AuthModule,
    IssuesModule,
  ],
})
export class SummaryModule {}
