import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Issue } from '../issues/issues.entity';

@Entity('github_commits')
export class GithubCommits {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 커밋 해시 (SHA)
   */
  @Column({ name: 'commit_hash', type: 'varchar', length: 64 })
  commitHash: string;

  /**
   * 커밋 메시지
   */
  @Column({ name: 'commit_message', type: 'text' })
  commitMessage: string;

  /**
   * 커밋 URL (예: GitHub 링크)
   */
  @Column({ name: 'commit_url', type: 'varchar', length: 255 })
  commitUrl: string;

  /**
   * 생성 일시
   */
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  /**
   * 연결된 이슈 (N:1 관계: 여러 커밋이 한 이슈에 연결)
   */
  @ManyToOne(() => Issue, (issue) => issue.commits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;
}
