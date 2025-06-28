import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty } from 'class-validator';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsNotEmpty()
  email: string;

  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty()
  display_name: string;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'text' })
  @IsNotEmpty()
  password_hash: string;

  @Column({ type: 'varchar', length: 50 })
  @IsNotEmpty()
  auth_provider: string;
}
