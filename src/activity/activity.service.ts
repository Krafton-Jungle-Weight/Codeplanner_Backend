import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './activity.entity';

export interface CreateActivityDto {
  projectId: string;
  issueId?: string;
  userId: string;
  actionType: string;
  issueTitle: string;
  details?: any;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityRepository: Repository<ActivityLog>,
  ) {}

  // 프로젝트 최근 활동 조회
  async getProjectActivities(projectId: string, limit = 10): Promise<ActivityLog[]> {
    return this.activityRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // 활동 로그 생성
  async createActivity(data: CreateActivityDto): Promise<ActivityLog> {
    const activity = this.activityRepository.create({
      projectId: data.projectId,
      issueId: data.issueId || null,
      userId: data.userId,
      actionType: data.actionType,
      issueTitle: data.issueTitle,
      details: data.details || null,
    });
    
    return this.activityRepository.save(activity);
  }

  // 특정 이슈의 활동 이력 조회
  async getIssueActivities(issueId: string): Promise<ActivityLog[]> {
    return this.activityRepository.find({
      where: { issueId },
      order: { createdAt: 'DESC' },
    });
  }
} 