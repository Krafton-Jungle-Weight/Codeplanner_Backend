import { Module } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { SummaryController } from './summary.controller';
import { IssuesService } from 'src/issues/issues.service';
import { ProjectMember } from 'src/project/project-member.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from 'src/issues/issues.entity';

// 인증 모듈
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [SummaryService, JwtAuthGuard, IssuesService],
  controllers: [SummaryController],
  imports: [TypeOrmModule.forFeature([ProjectMember, Issue]), AuthModule],
})
export class SummaryModule {}
