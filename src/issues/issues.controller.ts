import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/issue-info.dto';
import { Issue } from './issues.entity';

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

  @Patch('/projects/:projectId/:issueId')
  updateIssueInfo(
    @Body() IssueInfoDto: UpdateIssueDto,
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
  ): Promise<Issue>{
    return this.issuesService.updateIssueInfo(IssueInfoDto, projectId, issueId);
  }
}
