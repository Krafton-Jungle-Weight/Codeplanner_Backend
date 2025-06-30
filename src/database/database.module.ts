import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';
import { User } from 'src/user/user.entity';
import { EmailVerificationToken } from 'src/email/email.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,

      // SQL 통합
      // username: 'codeplanner',
      // password: 'codeplanner1234',
      // database: 'codeplanner',
      username: 'postgres',
      password: 'postgres',
      database: 'code-planner',
      autoLoadEntities: true,
      synchronize: true, // 개발 시만 true
    }),
  ProjectModule,
  forwardRef(() => UserModule), 
],
})
export class DatabaseModule {}
