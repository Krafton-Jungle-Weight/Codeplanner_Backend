import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('project/:projectId/recent')
  async getProjectRecentActivities(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const activities = await this.activityService.getProjectActivities(projectId, limitNum);
    
    // 프론트엔드에서 사용하기 쉽도록 데이터 포맷팅
    return activities.map(activity => ({
      id: activity.id,
      actionType: activity.actionType,
      issueTitle: activity.issueTitle,
      issueId: activity.issueId,
      details: activity.details,
      createdAt: activity.createdAt,
      // 사용자 정보는 나중에 join으로 추가 가능
    }));
  }

  @Get('issue/:issueId')
  async getIssueActivities(@Param('issueId') issueId: string) {
    return this.activityService.getIssueActivities(issueId);
  }
} 