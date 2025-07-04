import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Octokit } from 'octokit';
import { GithubToken } from './github.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';

@Injectable()
export class GithubService {
  constructor(
    @InjectRepository(GithubToken)
    private githubTokenRepository: Repository<GithubToken>,
  ) {}

  async connect(repoUrl: string, user: User) {
    console.log('repoUrl', repoUrl);
    const owner = repoUrl.split('/')[3];
    const repo = repoUrl.split('/')[4];
    console.log('owner', owner);
    console.log('repo', repo);
    console.log('user', user);

    const githubToken = await this.githubTokenRepository.findOne({
      where: { user_id: user.id },
    });

    if (!githubToken) {
      throw new NotFoundException('Github token not found');
    }
    console.log('githubToken: ', githubToken.access_token);

    const octokit = new Octokit({
      auth: githubToken.access_token,
    });

    const response = await octokit.request('POST /repos/{owner}/{repo}/hooks', {
      owner: owner,
      repo: repo,
      name: 'web',
      active: true,
      events: ['push', 'pull_request'],
      config: {
        url: 'https://code-planner.loca.lt/github/webhook',
        content_type: 'json',
        insecure_ssl: '0',
      },
    });
    console.log('response', response);
    if (response.status === 201) {
      console.log('Webhook created successfully');

      return response;
    } else {
      throw new Error('Failed to create webhook');
    }
  }
}
