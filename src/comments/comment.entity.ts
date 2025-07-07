import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Issue } from '../issues/issues.entity';
import { User } from '../user/user.entity';

@Entity('comment')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'issue_id' })
  issueId: string;

  @Column({ type: 'uuid', name: 'author_id' })
  authorId: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Issue, (issue) => issue.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;
}
