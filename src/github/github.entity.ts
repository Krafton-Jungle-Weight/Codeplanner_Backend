import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty, IsOptional } from 'class-validator';

@Entity('user_oauth_accounts')
export class GithubToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  user_id: string;

  @Column({ type: 'varchar', length: 50 })
  @IsNotEmpty()
  provider: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  provider_user_id: string;

  @Column({ type: 'text' })
  @IsNotEmpty()
  access_token: string;

  @Column({ type: 'timestamp' })
  @IsNotEmpty()
  connected_at: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  github_login?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  github_id?: string;
}