import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  project_name: string;

  @Column({ type: 'text', nullable: true })
  project_summary: string;

  @Column({ 
    type: 'enum', 
    enum: ['대기중', '진행중', '완료', '보류'], 
    default: '대기중'
  })
  project_status: string;

  @Column({ type: 'int', default: 1 })
  project_people: number;

  @Column({ type: 'timestamp', nullable: true })
  project_deadline: Date;

  @Column({ type: 'varchar', length: 100, nullable: false })
  project_leader: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
