import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from './activity.entity';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog]), AuthModule],
  controllers: [ActivityController],
  providers: [ActivityService, JwtAuthGuard],
  exports: [ActivityService], // Issues module에서 사용할 수 있도록 export
})
export class ActivityModule {} 