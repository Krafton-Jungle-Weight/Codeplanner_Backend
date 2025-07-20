import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Project } from '../project/project.entity'

@Entity('projectconfig')
export class ProjectConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ type: 'varchar', name: 'style', length: 50 })
  style: string;

  @Column({ type: 'int', name: 'indent'})
  indent: number;

  @Column({ type: 'uuid' })
  project_id: string;

  @OneToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
