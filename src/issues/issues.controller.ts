import { Controller, Get, Param } from '@nestjs/common';
import { IssuesService } from './issues.service';

@Controller('api')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get('/projects/:projectId/issues')
  getIssues(@Param('projectId') projectId: string) {
    return this.issuesService.getIssues(projectId);
  }
}
