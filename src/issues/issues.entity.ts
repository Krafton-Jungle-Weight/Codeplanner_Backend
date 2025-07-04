import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('issue')
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, name: 'issue_type' })
  issueType: string;

  @Column({ type: 'varchar', length: 20, default: 'TODO' })
  status: string;

  @Column({ type: 'uuid', nullable: true, name: 'assignee_id' })
  assigneeId: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'reporter_id' })
  reporterId: string | null;

  @Column({ type: 'date', nullable: true, name: 'start_date' })
  startDate: Date | null;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate: Date | null;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tag: string;
}
