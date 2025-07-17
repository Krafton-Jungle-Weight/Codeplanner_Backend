import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Issue } from './issues.entity';
import { User } from '../user/user.entity';

@Entity('issue_reviewer')
export class IssueReviewer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'issue_id' })
  issueId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'assigned_at' })
  assignedAt: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  status: 'pending' | 'approved' | 'rejected' | null;

  @Column({ type: 'text', nullable: true, name: 'review_comment' })
  reviewComment: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'reviewed_at' })
  reviewedAt: Date | null;

  @ManyToOne(() => Issue, (issue) => issue.reviewers)
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
} 