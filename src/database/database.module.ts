// ⚠️⚠️⚠️배포환경 관련 설정 주의 필요!!!⚠️⚠️⚠️
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isSSL = config.get('DB_SSL') === 'true';
        const sslOptions = isSSL
          ? {
              ca: fs.readFileSync(config.get('DB_SSL_CA_PATH') || './global-bundle.pem').toString(),
              rejectUnauthorized: false,
            }
          : false;

        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST', 'localhost'),
          port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
          username: config.get<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_DATABASE'),
          autoLoadEntities: true,
          synchronize: config.get('NODE_ENV') !== 'production',
          ssl: sslOptions,
        };
      },
    }),
    ProjectModule,
    forwardRef(() => UserModule),
  ],
})
export class DatabaseModule {}
