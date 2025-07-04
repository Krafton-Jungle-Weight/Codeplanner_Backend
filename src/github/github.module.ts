import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GithubToken } from './github.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GithubToken } from './github.entity';
import { AuthModule } from 'src/auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { ProjectModule } from 'src/project/project.module';

@Module({
  imports: [TypeOrmModule.forFeature([GithubToken]), AuthModule, HttpModule, ProjectModule],
  controllers: [GithubController],
  providers: [GithubService, JwtAuthGuard],
  exports: [GithubService, JwtAuthGuard],
})
export class GithubModule {}
