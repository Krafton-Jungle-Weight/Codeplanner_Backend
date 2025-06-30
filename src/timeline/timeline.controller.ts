import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TimelineService } from './timeline.service';
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
  async getProjectSummary(@Param() params: GetProjectSummaryDto): Promise<ProjectSummaryResponseDto> {
    // 임시로 하드코딩된 사용자 ID 사용
    const userId = '550e8400-e29b-41d4-a716-446655440001';
    return this.timelineService.getProjectSummary(params.projectId, userId);
  }

  @Get(':projectId/statistics')
  @ApiOperation({ summary: '프로젝트 통계 조회' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '프로젝트 통계 조회 성공',
    type: [ProjectStatisticsResponseDto] 
  })
  async getProjectStatistics(@Param() params: GetProjectStatisticsDto): Promise<ProjectStatisticsResponseDto[]> {
    // 임시로 하드코딩된 사용자 ID 사용
    const userId = '550e8400-e29b-41d4-a716-446655440001';
    return this.timelineService.getProjectStatistics(params.projectId, userId);
  }

  @Get(':projectId/gantt-data')
  @ApiOperation({ summary: '간트 차트 데이터 조회' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '간트 차트 데이터 조회 성공',
    type: [GanttDataResponseDto] 
  })
  async getGanttData(@Param() params: GetGanttDataDto): Promise<GanttDataResponseDto[]> {
    // 임시로 하드코딩된 사용자 ID 사용
    const userId = '550e8400-e29b-41d4-a716-446655440001';
    return this.timelineService.getGanttData(params.projectId, userId);
  }

  @Get(':projectId/overview')
  @ApiOperation({ summary: '프로젝트 개요 조회' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '프로젝트 개요 조회 성공',
    type: ProjectOverviewResponseDto 
  })
  async getProjectOverview(@Param() params: GetProjectOverviewDto): Promise<ProjectOverviewResponseDto> {
    // 임시로 하드코딩된 사용자 ID 사용
    const userId = '550e8400-e29b-41d4-a716-446655440001';
    return this.timelineService.getProjectOverview(params.projectId, userId);
  }
}