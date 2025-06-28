import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';
import { User } from '../user/user.entity';

@Entity('project_member')
export class ProjectMember {

    // 프로젝트 고유 값 (랜덤부여)
    @PrimaryColumn({ type: 'uuid' })
    project_id: string;

    // 프로젝트 소속 유저 고유 값
    @PrimaryColumn({ type: 'uuid' })
    user_id: string;

    // 프로젝트 소속 유저 역할
    @Column({ type: 'varchar', length: 20, default: 'MEMBER' })
    role: string;

    // 관계 설정
    @ManyToOne(() => Project, project => project.members)
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @ManyToOne(() => User, user => user.projectMemberships)
    @JoinColumn({ name: 'user_id' })
    user: User;
} 