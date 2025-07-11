import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { IssueLabel } from './issue_label.entity';

@Entity('label')
@Unique(['projectId', 'name'])
export class Label {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 7 })
  color: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => IssueLabel, (issueLabel) => issueLabel.label)
  issueLabels: IssueLabel[];
}
