import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { IssuesService } from 'src/issues/issues.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class SummaryController {
  constructor(
    private readonly summaryService: SummaryService,
    private readonly issuesService: IssuesService,
  ) {}

  @Get('summary/:projectId/issues')
  async getSummary(@Param('projectId') projectId: string) {
    return await this.issuesService.getIssues(projectId);
  }

  @Get('summary/:projectId/members')
  async getMembers(@Param('projectId') projectId: string) {
    console.log(projectId);
    return await this.summaryService.getMembers(projectId);
  }
}
