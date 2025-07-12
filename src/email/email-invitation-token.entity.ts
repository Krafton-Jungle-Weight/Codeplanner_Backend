import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('email_verification_tokens')
export class EmailInvitationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  verification_code: string;

  @Column({ type: 'timestamptz', nullable: false })
  expires_at: Date;

  @Column({ type: 'uuid', nullable: true })
  project_id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  role: string;

  @CreateDateColumn()
  created_at: Date;
} 