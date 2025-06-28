import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty } from 'class-validator';

// 이메일 인증 토큰 엔티티
@Entity('email_verification_tokens')
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  verification_code: string;

  @Column({ type: 'timestamp' })
  @IsNotEmpty()
  expires_at: Date;
}
