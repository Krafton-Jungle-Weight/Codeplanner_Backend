import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { HttpModule } from '@nestjs/axios';
import { ProjectModule } from '../project/project.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Module({
  imports: [HttpModule, ProjectModule, AuthModule],
  providers: [GithubService, JwtAuthGuard],
  controllers: [GithubController],
  exports: [GithubService],
})
export class GithubModule {}
