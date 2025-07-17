import { Module } from '@nestjs/common';
import { AimodelController } from './aimodel.controller';
import { AimodelService } from './aimodel.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthModule } from 'src/auth/auth.module';
import { ProjectModule } from 'src/project/project.module';

@Module({
  imports: [AuthModule, ProjectModule],
  controllers: [AimodelController],
  providers: [AimodelService, JwtAuthGuard]
})
export class AimodelModule {}
