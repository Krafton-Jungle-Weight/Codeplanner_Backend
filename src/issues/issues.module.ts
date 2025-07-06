import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { Issue } from './issues.entity';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { EmailModule } from 'src/email/email.module';
import { ProjectModule } from 'src/project/project.module';
import { GithubModule } from 'src/github/github.module';
import { ProjectService } from 'src/project/project.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue]),
    AuthModule,
    EmailModule,
    ProjectModule,
    GithubModule,

  ],
  controllers: [IssuesController],
  providers: [IssuesService, JwtAuthGuard,],
  exports: [IssuesService, JwtAuthGuard,],
})
export class IssuesModule {}
