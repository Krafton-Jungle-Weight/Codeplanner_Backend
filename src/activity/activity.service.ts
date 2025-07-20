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

interface RateLimitEntry {
  timestamp: number;
  count: number;
}

@Injectable()
export class ActivityService {
  // 사용자별 rate limiting을 위한 Map
  private userActivityTimestamps = new Map<string, RateLimitEntry>();
  private readonly RATE_LIMIT_DURATION = 10; // 0.01초 (10ms) - 동시성 제어용
  private readonly MAX_ACTIVITIES_PER_WINDOW = 1; // 0.01초 동안 최대 1개 활동
  private readonly CLEANUP_THRESHOLD = 1000; // Map 크기가 1000개를 넘으면 정리

  constructor(
    @InjectRepository(ActivityLog)
    private activityRepository: Repository<ActivityLog>,
  ) {}

  // Rate limiting 체크 (동시성 제어)
  // 0.01초 정도면 대부분의 중복 요청을 차단할 수 있음
  // JavaScript는 단일 스레드이므로 실제 동시성은 없지만, 
  // 비동기 작업들이 빠르게 연속 실행되는 것을 방지
  private isRateLimited(userId: string, actionType: string): boolean {
    const key = `${userId}:${actionType}`;
    const now = Date.now();
    const entry = this.userActivityTimestamps.get(key);
    
    if (!entry) {
      // 첫 번째 활동
      this.userActivityTimestamps.set(key, { timestamp: now, count: 1 });
      
      // Map 크기가 임계값을 넘으면 정리
      if (this.userActivityTimestamps.size > this.CLEANUP_THRESHOLD) {
        this.cleanupOldTimestamps();
      }
      
      return false;
    }
    
    // 시간 윈도우 체크
    if (now - entry.timestamp < this.RATE_LIMIT_DURATION) {
      // 윈도우 내에서 활동 횟수 체크
      if (entry.count >= this.MAX_ACTIVITIES_PER_WINDOW) {
        return true; // Rate limited
      }
      // 활동 횟수 증가
      entry.count++;
      return false;
    } else {
      // 새로운 윈도우 시작
      this.userActivityTimestamps.set(key, { timestamp: now, count: 1 });
      return false;
    }
  }

  // 오래된 타임스탬프 정리 (메모리 누수 방지)
  private cleanupOldTimestamps() {
    const now = Date.now();
    const cutoff = now - this.RATE_LIMIT_DURATION * 10; // 0.1초 이상 된 데이터 정리
    
    let cleanedCount = 0;
    for (const [key, entry] of this.userActivityTimestamps.entries()) {
      if (entry.timestamp < cutoff) {
        this.userActivityTimestamps.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old rate limit entries`);
    }
  }

  // 프로젝트 최근 활동 조회
  async getProjectActivities(projectId: string, limit = 10): Promise<ActivityLog[]> {
    return this.activityRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // 활동 로그 생성 (Rate limiting 적용)
  async createActivity(data: CreateActivityDto): Promise<ActivityLog | null> {
    // Rate limiting 체크
    if (this.isRateLimited(data.userId, data.actionType)) {
      console.log(`Rate limited: User ${data.userId} tried to log ${data.actionType} too frequently`);
      return null; // 로깅 건너뛰기
    }

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