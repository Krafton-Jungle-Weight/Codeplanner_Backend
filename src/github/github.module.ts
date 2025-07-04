import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { HttpModule } from '@nestjs/axios';
import { ProjectModule } from '../project/project.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GithubToken } from './github.entity';

@Module({
  imports: [
    HttpModule,
    ProjectModule,
    AuthModule,
    TypeOrmModule.forFeature([GithubToken]),
  ],
  providers: [GithubService, JwtAuthGuard],
  controllers: [GithubController],
  exports: [GithubService],
})
export class GithubModule {}
