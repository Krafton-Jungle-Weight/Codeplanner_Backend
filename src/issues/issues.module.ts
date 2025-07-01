import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { Issue } from './issues.entity';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue]),
    AuthModule
    ],
  controllers: [IssuesController],
  providers: [IssuesService, JwtAuthGuard],
  exports: [IssuesService, JwtAuthGuard],
})

export class IssuesModule {}