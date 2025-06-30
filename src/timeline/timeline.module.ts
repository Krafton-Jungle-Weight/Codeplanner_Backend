import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { Issue } from '../issues/issues.entity';
import { Project } from '../project/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue, Project]),
  ],
  controllers: [TimelineController],
  providers: [TimelineService],
  exports: [TimelineService],
})
export class TimelineModule {}