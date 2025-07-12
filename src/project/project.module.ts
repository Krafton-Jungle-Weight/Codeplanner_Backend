import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectMember } from './project-member.entity';
import { User } from '../user/user.entity';
import { Label } from '../issues/label.entity';
import { IssueLabel } from '../issues/issue_label.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthModule } from 'src/auth/auth.module';
// 프로젝트 모듈
@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, User, Label, IssueLabel]),
    AuthModule,
  ],
  providers: [ProjectService, JwtAuthGuard],
  controllers: [ProjectController],
  exports: [ProjectService],
})
export class ProjectModule {}
