import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from '../issues/issues.entity';
import { Project } from '../project/project.entity';
import { ProjectSummaryResponseDto } from './dto/get-project-summary.dto';
import { ProjectStatisticsResponseDto } from './dto/get-project-statistics.dto';
import { GanttDataResponseDto } from './dto/get-gantt-data.dto';
import { ProjectOverviewResponseDto } from './dto/get-project-overview.dto';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(Issue)
    private issueRepository: Repository<Issue>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async getProjectSummary(projectId: string, userId: string): Promise<ProjectSummaryResponseDto> {
    // 전체 작업 수
    const totalTasks = await this.issueRepository.count({
      where: { projectId }
    });

    // 진행률 계산
    const totalIssues = await this.issueRepository.count({
      where: { projectId }
    });

    const completedIssues = await this.issueRepository.count({
      where: { projectId, status: 'done' }
    });

    const progress = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

    // 프로젝트 정보 조회 (마감일 포함)
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['due_date', 'title']
    });

    // 팀원 수 계산 (issue.assignee_id의 고유 개수)
    const teamMembersCount = await this.issueRepository
      .createQueryBuilder('issue')
      .select('COUNT(DISTINCT issue.assigneeId)', 'count')
      .where('issue.projectId = :projectId', { projectId })
      .andWhere('issue.assigneeId IS NOT NULL')
      .getRawOne();

    // 프로젝트 제목 (프로젝트 테이블의 title 사용)
    const projectTitle = project?.title || '프로젝트';

    return {
      totalTasks,
      progress,
      dueDate: project?.due_date ? new Date(project.due_date).toISOString().split('T')[0] : null,
      teamMembers: parseInt(teamMembersCount?.count || '0'),
      projectTitle
    };
  }

  async getProjectStatistics(projectId: string, userId: string): Promise<ProjectStatisticsResponseDto[]> {
    // 작업 상태별 통계
    const statusStats = await this.issueRepository
      .createQueryBuilder('issue')
      .select('issue.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('issue.projectId = :projectId', { projectId })
      .groupBy('issue.status')
      .getRawMany();

    // 상태별 색상 및 라벨 매핑
    const statusMap = {
      'TODO': { label: '대기 중', color: '#fbbf24', count: 0 },
      'inprogress': { label: '진행 중', color: '#3b82f6', count: 0 },
      'done': { label: '완료', color: '#10b981', count: 0 },
      'blocked': { label: '차단됨', color: '#ef4444', count: 0 }
    };

    // 조회된 통계 데이터를 매핑
    statusStats.forEach(row => {
      const status = row.status?.toLowerCase();
      if (status === 'todo') {
        statusMap['TODO'].count = parseInt(row.count);
      } else if (status === 'inprogress') {
        statusMap['inprogress'].count = parseInt(row.count);
      } else if (status === 'done') {
        statusMap['done'].count = parseInt(row.count);
      } else if (status === 'blocked') {
        statusMap['blocked'].count = parseInt(row.count);
      }
    });

    // count가 0보다 큰 상태만 반환
    return Object.values(statusMap).filter(stat => stat.count > 0);
  }

  async getGanttData(projectId: string, userId: string): Promise<GanttDataResponseDto[]> {
    // Gantt 차트용 작업 데이터 조회
    const tasks = await this.issueRepository
      .createQueryBuilder('issue')
      .select([
        'issue.id', 
        'issue.title', 
        'issue.startDate', 
        'issue.dueDate',
        'issue.status',
        'issue.issueType'
      ])
      .where('issue.projectId = :projectId', { projectId })
      .andWhere('issue.startDate IS NOT NULL')
      .andWhere('issue.dueDate IS NOT NULL')
      .orderBy('issue.startDate', 'ASC')
      .getMany();

    console.log('조회된 작업 데이터:', tasks); // 디버깅용 로그

    return tasks.map(task => {
      // startDate와 dueDate를 Date 객체로 변환 후 문자열로 변환
      const startDate = task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : null;
      const endDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null;
      
      // 진행률 계산 (상태에 따라)
      let progress = 0;
      if (task.status === 'done') {
        progress = 100;
      } else if (task.status === 'inprogress') {
        progress = 50;
      } else if (task.status === 'TODO') {
        progress = 0;
      }
      
      return {
        id: task.id,
        name: task.title,
        start: startDate,
        end: endDate,
        progress: progress
      };
    });
  }

  async getProjectOverview(projectId: string, userId: string): Promise<ProjectOverviewResponseDto> {
    // 프로젝트 정보 조회
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['title', 'descrition', 'project_key', 'status', 'repository_url', 'due_date']
    });

    // 이슈 통계 조회
    const projectStats = await this.issueRepository
      .createQueryBuilder('issue')
      .select([
        'COUNT(*) as totalIssues',
        'COUNT(CASE WHEN issue.status = \'done\' THEN 1 END) as completedIssues',
        'MIN(issue.startDate) as earliestStart',
        'MAX(issue.dueDate) as latestDue'
      ])
      .where('issue.projectId = :projectId', { projectId })
      .getRawOne();

    // 이슈 타입별 라벨 생성
    const issueTypes = await this.issueRepository
      .createQueryBuilder('issue')
      .select('DISTINCT issue.issueType', 'type')
      .where('issue.projectId = :projectId', { projectId })
      .getRawMany();

    const labels = issueTypes.map(type => type.type).filter(Boolean);

    // 프로젝트 상태 결정
    let status = project?.status || 'ACTIVE';
    if (projectStats.completedIssues === projectStats.totalIssues && projectStats.totalIssues > 0) {
      status = 'COMPLETED';
    } else if (project?.due_date && new Date(project.due_date) < new Date()) {
      status = 'OVERDUE';
    }

    return {
      title: project?.title || '프로젝트',
      description: project?.descrition || '프로젝트 설명이 없습니다.',
      projectKey: project?.project_key || `PROJ-${projectId.substring(0, 8).toUpperCase()}`,
      status: status,
      repositoryUrl: project?.repository_url || null,
      dueDate: project?.due_date ? new Date(project.due_date).toISOString().split('T')[0] : null,
      labels: labels
    };
  }
} 