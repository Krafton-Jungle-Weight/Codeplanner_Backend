import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Project } from '../project/project.entity';
import { ProjectMember } from '../project/project-member.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  display_name: string;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'text', nullable: false })
  password_hash: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  auth_provider: string;

  // 관계 설정
  @OneToMany(() => Project, project => project.leader)
  ledProjects: Project[];

  @OneToMany(() => ProjectMember, projectMember => projectMember.user)
  projectMemberships: ProjectMember[];
} 