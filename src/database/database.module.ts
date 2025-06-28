import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { EmailVerificationToken } from 'src/email/email.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'codeplanner',
      password: 'codeplanner1234',
      database: 'codeplanner',
      entities: [__dirname + '/../**/*.entity.{js,ts}'],
      synchronize: true,
    }),
  ],
})
export class DatabaseModule {}
