import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Issue } from './issues.entity';
import { Label } from './label.entity';

@Entity('issue_label')
export class IssueLabel {
  @PrimaryColumn('uuid', { name: 'issue_id' })
  issueId: string;

  @PrimaryColumn('uuid', { name: 'label_id' })
  labelId: string;

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @ManyToOne(() => Label, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'label_id' })
  label: Label;
}
 