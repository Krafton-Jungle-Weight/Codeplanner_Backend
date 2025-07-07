import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Octokit } from 'octokit';
import { GithubToken } from './github.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';

@Injectable()
export class GithubPullRequestService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(GithubToken)
    private githubTokenRepository: Repository<GithubToken>,
  ) {}

  async createPullRequest(user: any, projectId: string, body: any) {
    const githubToken = await this.githubTokenRepository.findOne({
      where: { user_id: user.id },
    });

    if (!githubToken) {
      throw new Error('GitHub 토큰이 없습니다.');
    }
    // title : pull request 제목
    // head : 브랜치 이름
    // base : 브랜치 이름
    // repo : 저장소 이름
    // owner : 저장소 소유자
    // prBody : pull request 설명
    const { title, head, base, repo, owner, prBody } = body;

    // GitHub API 요청
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls`;

    const response = await axios.post(
      url,
      {
        title,
        head,
        base,
        body: prBody || '', // PR 설명이 있으면 사용, 없으면 빈 문자열
      },
      {
        headers: {
          Authorization: `Bearer ${githubToken.access_token}`,
          Accept: 'application/vnd.github+json',
        },
      },
    );

    // 성공 시 PR 정보 반환
    return response.data;
  }

  async getPullRequestFileChanges(user: any, projectId: string, pull_number: string, owner: string, repo: string){
    const githubToken = await this.githubTokenRepository.findOne({
        where: { user_id: user.id },
      });
  
      if (!githubToken) {
        throw new Error('GitHub 토큰이 없습니다.');
      }

      const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/files`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${githubToken.access_token}`,
          Accept: 'application/vnd.github+json',
        },
      });

      return response.data;
  }
}
