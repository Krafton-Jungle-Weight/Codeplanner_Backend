import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('activity_log')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @Column({ type: 'uuid', name: 'issue_id', nullable: true })
  issueId: string | null;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 50, name: 'action_type' })
  actionType: string; // 'issue_created', 'issue_updated', 'issue_deleted', 'status_changed', 'assignee_changed'

  @Column({ type: 'varchar', length: 255, name: 'issue_title' })
  issueTitle: string;

  @Column({ type: 'jsonb', nullable: true })
  details: any; // 변경 사항 세부 정보 { field: 'status', oldValue: 'TODO', newValue: 'IN_PROGRESS' }

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
} 