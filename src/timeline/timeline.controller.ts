import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TimelineService } from './timeline.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/user.decorator';
import { User } from 'src/user/user.entity';
import { 
  GetProjectSummaryDto, 
  ProjectSummaryResponseDto 
} from './dto/get-project-summary.dto';
import { 
  GetProjectStatisticsDto, 
  ProjectStatisticsResponseDto 
} from './dto/get-project-statistics.dto';
import { 
  GetGanttDataDto, 
  GanttDataResponseDto 
} from './dto/get-gantt-data.dto';
import { 
  GetProjectOverviewDto, 
  ProjectOverviewResponseDto 
} from './dto/get-project-overview.dto';

@ApiTags('타임라인')
@UseGuards(JwtAuthGuard)
@Controller('timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get(':projectId/summary')
  @ApiOperation({ summary: '프로젝트 요약 조회' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '프로젝트 요약 조회 성공',
    type: ProjectSummaryResponseDto 
  })
  async getProjectSummary(
    @Param() params: GetProjectSummaryDto,
    @CurrentUser() user: User
  ): Promise<ProjectSummaryResponseDto> {
    return this.timelineService.getProjectSummary(params.projectId, user.id);
  }

  @Get(':projectId/statistics')
  @ApiOperation({ summary: '프로젝트 통계 조회' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '프로젝트 통계 조회 성공',
    type: [ProjectStatisticsResponseDto] 
  })
  async getProjectStatistics(
    @Param() params: GetProjectStatisticsDto,
    @CurrentUser() user: User
  ): Promise<ProjectStatisticsResponseDto[]> {
    return this.timelineService.getProjectStatistics(params.projectId, user.id);
  }

  @Get(':projectId/gantt-data')
  @ApiOperation({ summary: '간트 차트 데이터 조회' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '간트 차트 데이터 조회 성공',
    type: [GanttDataResponseDto] 
  })
  async getGanttData(
    @Param() params: GetGanttDataDto,
    @CurrentUser() user: User
  ): Promise<GanttDataResponseDto[]> {
    return this.timelineService.getGanttData(params.projectId, user.id);
  }

  @Get(':projectId/overview')
  @ApiOperation({ summary: '프로젝트 개요 조회' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '프로젝트 개요 조회 성공',
    type: ProjectOverviewResponseDto 
  })
  async getProjectOverview(
    @Param() params: GetProjectOverviewDto,
    @CurrentUser() user: User
  ): Promise<ProjectOverviewResponseDto> {
    return this.timelineService.getProjectOverview(params.projectId, user.id);
  }
}