import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { User } from './user.entity';

export const userProviders = [
  {
    provide: 'USER_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: [getDataSourceToken()],
  },
];
