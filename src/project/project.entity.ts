import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../user/user.entity';
import { ProjectMember } from './project-member.entity';

@Entity('project')
export class Project {
    @PrimaryGeneratedColumn('uuid')  // 프로젝트 ID
    id: string;

    @Column({ type: 'varchar', length: 255, nullable: false })  // 프로젝트 제목
    title: string;

    @Column({ type: 'text', nullable: true })  // 프로젝트 설명
    descrition: string;

    @Column({ type: 'varchar', length: 20, unique: true, nullable: false })  // 프로젝트 키(Github 연동시 사용, 추후에 수정)
    project_key: string;

    @Column({ type: 'uuid', nullable: false })  // 프로젝트 담당자 ID
    leader_id: string;

    @Column({          // 프로젝트 상태(기본은 대기중)
        type: 'varchar', 
        length: 20, 
        default: '대기중'
    })
    status: string;

    @Column({ type: 'text', nullable: true })  // 프로젝트 저장소 URL
    repository_url: string;

    @Column({ type: 'date', nullable: true })  // 프로젝트 마감일
    due_date: Date;

    @Column({ type: 'timestamptz', nullable: true })  // 프로젝트 만료일(이게 있어야하는지 모르겠다.)
    expires_at: Date;

    // 관계 설정
    @ManyToOne(() => User, user => user.ledProjects)
    @JoinColumn({ name: 'leader_id' })
    leader: User;

    @OneToMany(() => ProjectMember, projectMember => projectMember.project)
    members: ProjectMember[];
    }
