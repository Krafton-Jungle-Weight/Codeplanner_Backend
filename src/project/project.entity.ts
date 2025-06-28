import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../user/user.entity';
import { ProjectMember } from './project-member.entity';

@Entity('project')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  descrition: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  project_key: string;

  @Column({ type: 'uuid', nullable: false })
  leader_id: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: '대기중'
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  repository_url: string;

  @Column({ type: 'date', nullable: true })
  due_date: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date;

  // 관계 설정
  @ManyToOne(() => User, user => user.ledProjects)
  @JoinColumn({ name: 'leader_id' })
  leader: User;

  @OneToMany(() => ProjectMember, projectMember => projectMember.project)
  members: ProjectMember[];
}
