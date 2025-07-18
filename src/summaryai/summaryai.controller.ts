import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SummaryaiService } from './summaryai.service';
import { ContributionAnalysisRequestDto, ContributionAnalysisResponseDto } from './dto/contribution-analysis.dto';
import { ActivityData, ProjectTimeline, CollaborationFeedback, ContributionStats } from './dto/contribution-analysis.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('summaryai')
@UseGuards(JwtAuthGuard)
export class SummaryaiController {
  constructor(private readonly summaryaiService: SummaryaiService) {}

  @Post('analyze-contribution')
  async analyzeContribution(
    @Body() dto: ContributionAnalysisRequestDto,
    @Request() req: any
  ): Promise<ContributionAnalysisResponseDto> {
    // 사용자 ID를 요청에서 가져와서 DTO에 설정
    dto.userId = req.user.id;
    
    return this.summaryaiService.analyzeContribution(dto);
  }

  @Post('base-stats')
  async getBaseStats(
    @Body() dto: ContributionAnalysisRequestDto,
    @Request() req: any
  ): Promise<Partial<ContributionAnalysisResponseDto>> {
    dto.userId = req.user.id;
    // 1. 데이터 수집
    const { projectId, userId, owner, repo } = dto;
    const includeMergeCommits = false; // base-stats는 항상 false
    const [userActivities, projectTimeline] = await Promise.all([
      this.summaryaiService.collectUserActivities(userId, projectId, owner, repo, includeMergeCommits),
      this.summaryaiService.collectProjectTimeline(userId, projectId, owner, repo)
    ]);
    const userStats = this.summaryaiService.calculateContributionStats(userActivities, projectTimeline);
    const collaborationFeedback = await this.summaryaiService.analyzeCollaborationStyle(userActivities);
    return {
      userStats,
      collaborationFeedback,
      userActivities
    };
  }

  @Post('user-activities')
  async getUserActivities(
    @Body() dto: ContributionAnalysisRequestDto,
    @Request() req: any
  ): Promise<ActivityData[]> {
    dto.userId = req.user.id;
    return this.summaryaiService.collectUserActivities(dto.userId, dto.projectId, dto.owner, dto.repo);
  }

  @Post('timeline')
  async getTimeline(
    @Body() dto: ContributionAnalysisRequestDto,
    @Request() req: any
  ): Promise<ProjectTimeline> {
    dto.userId = req.user.id;
    return this.summaryaiService.collectProjectTimeline(dto.userId, dto.projectId, dto.owner, dto.repo);
  }

  @Post('collaboration')
  async getCollaborationFeedback(
    @Body() dto: ContributionAnalysisRequestDto,
    @Request() req: any
  ): Promise<CollaborationFeedback> {
    dto.userId = req.user.id;
    const activities = await this.summaryaiService.collectUserActivities(dto.userId, dto.projectId, dto.owner, dto.repo);
    return this.summaryaiService.analyzeCollaborationStyle(activities);
  }

  @Post('stats')
  async getContributionStats(
    @Body() dto: ContributionAnalysisRequestDto,
    @Request() req: any
  ): Promise<ContributionStats> {
    dto.userId = req.user.id;
    const activities = await this.summaryaiService.collectUserActivities(dto.userId, dto.projectId, dto.owner, dto.repo);
    const timeline = await this.summaryaiService.collectProjectTimeline(dto.userId, dto.projectId, dto.owner, dto.repo);
    return this.summaryaiService.calculateContributionStats(activities, timeline);
  }
} 