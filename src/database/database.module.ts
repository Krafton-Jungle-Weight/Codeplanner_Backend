import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'codeplanner',
      autoLoadEntities: true,
      synchronize: true, // 개발 시만 true
    }),
    ProjectModule,
    UserModule,
  ],
})
export class DatabaseModule {}
