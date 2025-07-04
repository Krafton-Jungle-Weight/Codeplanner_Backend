import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GithubToken } from './github.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([GithubToken]), AuthModule],
  controllers: [GithubController],
  providers: [GithubService, JwtAuthGuard],
  exports: [GithubService, JwtAuthGuard],
})
export class GithubModule {}
