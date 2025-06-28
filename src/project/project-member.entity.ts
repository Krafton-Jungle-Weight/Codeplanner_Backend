import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';
import { User } from '../user/user.entity';

@Entity('project_member')
export class ProjectMember {
    @PrimaryColumn({ type: 'uuid' })  // 프로젝트 고유 값 (랜덤부여)
    project_id: string;

    @PrimaryColumn({ type: 'uuid' })  // 프로젝트 소속 유저 고유 값
    user_id: string;

    @Column({ type: 'varchar', length: 20, default: 'MEMBER' })  // 프로젝트 소속 유저 역할
    role: string;

    // 관계 설정
    @ManyToOne(() => Project, project => project.members)
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @ManyToOne(() => User, user => user.projectMemberships)
    @JoinColumn({ name: 'user_id' })
    user: User;
} 