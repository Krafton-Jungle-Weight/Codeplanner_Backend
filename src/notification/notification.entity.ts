import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // e.g. 'message', 'system', 'comment'

  @Column({ type: 'jsonb' })
  payload: any; // 알림 내용을 담는 구조체

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'read_at' })
  readAt: Date | null;
}
