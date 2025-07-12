import { Body, Controller, Get, Param, Post, UseGuards, Query, HttpException} from '@nestjs/common';
import { Request } from 'express';
import { GithubService } from './github.service';
import { ProjectService } from '../project/project.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GithubToken } from './github.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { CurrentUser } from 'src/auth/user.decorator';
import { parseGitHubUrl } from './github.utils';
import { GithubPullRequestService } from './github-pull-request.service';

@Controller('github')
export class GithubPullRequestController {
    constructor(
        private readonly githubService: GithubService,
        private readonly projectService: ProjectService,
        @InjectRepository(GithubToken)
        private githubTokenRepository: Repository<GithubToken>,
        private readonly githubPullRequestService: GithubPullRequestService,
      ) {}

      @UseGuards(JwtAuthGuard)
      @Post('project/:projectId/merge-pull-request')
      async getMergeCommit(
        @CurrentUser() user: any,
        @Param('projectId') projectId: string,
        @Body() body: any,
      ) {
        try{
            return await this.githubPullRequestService.getMergeCommit(user, projectId, body);
        } catch (error){
            console.error('Merge Pull Request Error:', error);
            if(error.response, error.response.status){
                throw new HttpException(error.response.data?.message || 'GitHub API Error', error.response.status);
            }
            throw new HttpException('GitHub API Error', 500);
        }
      }
}