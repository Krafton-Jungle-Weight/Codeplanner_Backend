import { Body, Controller, Param, Post, UseGuards, HttpException} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GithubToken } from './github.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CurrentUser } from 'src/auth/user.decorator';
import { GithubPullRequestService } from './github-pull-request.service';

@Controller('github')
export class GithubPullRequestController {
    constructor(
        @InjectRepository(GithubToken)
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