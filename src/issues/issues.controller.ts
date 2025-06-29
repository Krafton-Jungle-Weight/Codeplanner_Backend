import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';

@Controller('api')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get('/projects/:projectId/issues')
  getIssues(@Param('projectId') projectId: string) {
    return this.issuesService.getIssues(projectId);
  }

  @Post('/projects/:projectId/issues')
  createIssue(@Body() createIssueDto: CreateIssueDto){
    return this.issuesService.createIssue(createIssueDto);
  }

  @Get('/projects/:projectId/:issueId')
  getIssueById(
    @Param('issueId') issueId: string,
    @Param('projectId') projectId: string,
  ){
    return this.issuesService.findIssueById(issueId, projectId)
  }
}
