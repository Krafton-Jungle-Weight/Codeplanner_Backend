import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { Issue } from '../issues/issues.entity';
import { Project } from '../project/project.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue, Project]),
    AuthModule,
  ],
  controllers: [TimelineController],
  providers: [TimelineService, JwtAuthGuard],
  exports: [TimelineService],
})
export class TimelineModule {}