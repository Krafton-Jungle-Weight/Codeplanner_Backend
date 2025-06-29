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

      // 태용 SQL
      username: 'postgres',
      password: 'root',
      database: 'codeplanner',
      autoLoadEntities: true,
      synchronize: true, // 개발 시만 true
    }),

    /*
      // 명석 SQL
      username: 'codeplanner',
      password: 'codeplanner1234',
      database: 'codeplanner',
      autoLoadEntities: true,
      synchronize: true,
    }),
    */

  ProjectModule,
  forwardRef(() => UserModule), 
],
})
export class DatabaseModule {}
