import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto, ReorderIssuesDto } from './issues-update.dto';

@Controller('api')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get('/projects/:projectId/issues')
  getIssues(@Param('projectId') projectId: string) {
    return this.issuesService.getIssues(projectId);
  }

  @Patch('/projects/:projectId/issues/updateOrder')
  async updateIssueOrderAndStatus(@Body() dto: ReorderIssuesDto) {
    await this.issuesService.updateIssueOrderAndStatus(
      dto.issueIds,
      dto.targetColumnId,
    );
    return { success: 'Issue order and status updated successfully' };
  }

  @Post('/projects/:projectId/issues/create')
  async createIssue(
    @Param('projectId') projectId: string,
    @Body() dto: CreateIssueDto,
  ) {
    console.log(projectId, dto);
    await this.issuesService.createIssue(projectId, dto);
    return { success: 'Issue created successfully' };
  }
}
