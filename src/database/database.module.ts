// ⚠️⚠️⚠️배포환경 관련 설정 주의 필요!!!⚠️⚠️⚠️
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';
import { User } from 'src/user/user.entity';
import { EmailVerificationToken } from 'src/email/email.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    ProjectModule,
    forwardRef(() => UserModule),
  ],
})
export class DatabaseModule {}
