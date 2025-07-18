import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ProjectMember } from './project-member.entity';
import { Label } from '../issues/label.entity';

@Entity('project')
export class Project {
  // 프로젝트 ID
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 프로젝트 제목
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  // 프로젝트 설명
  @Column({ type: 'text', nullable: true })
  description: string;

  // 프로젝트 키(Github 연동시 사용, 추후에 수정)
  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  project_key: string;

  // 프로젝트 담당자 ID
  @Column({ type: 'uuid', nullable: false })
  leader_id: string;

  // 프로젝트 상태(기본은 대기중)
  @Column({
    type: 'varchar',
    length: 20,
    default: '대기중',
  })
  status: string;

  // 프로젝트 저장소 URL
  @Column({ type: 'text', nullable: true })
  repository_url: string;

  // 프로젝트 마감일
  @Column({ type: 'date', nullable: true })
  due_date: Date;

  // 프로젝트 만료일(이게 있어야하는지 모르겠다.)
  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date;

  // // 최근 방문일시
  // @Column({ type: 'timestamptz', nullable: true })
  // last_visited_at: Date;

  // 프로젝트 태그 (고유한 값)
  @Column({ type: 'varchar', length: 50, nullable: true })
  tag: string;

  // 태그에 붙을 번호 (기본값 0)
  @Column({ type: 'int', default: 0, nullable: true })
  tag_number: number;

  // 관계 설정
  @ManyToOne(() => User, (user) => user.ledProjects)
  @JoinColumn({ name: 'leader_id' })
  leader: User;

  @OneToMany(() => ProjectMember, (projectMember) => projectMember.project)
  members: ProjectMember[];

  @OneToMany(() => Label, (label) => label.project)
  labels: Label[];
}
