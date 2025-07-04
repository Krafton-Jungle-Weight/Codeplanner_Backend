import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Octokit } from 'octokit';
import { GithubToken } from './github.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';

@Injectable()
export class GithubService {
  private readonly githubApiUrl = 'https://api.github.com';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(GithubToken)
    private githubTokenRepository: Repository<GithubToken>,
  ) {}

  private async getHeaders(userId: string) {
    console.log(`[GitHub Service] 토큰 조회 시작: 사용자 ID ${userId}`);
    
    const tokenEntity = await this.githubTokenRepository.findOne({ 
      where: { user_id: userId, provider: 'github' } 
    });
    
    if (!tokenEntity) {
      console.error(`[GitHub Service] 사용자 ${userId}의 GitHub 토큰을 찾을 수 없습니다`);
      console.log(`[GitHub Service] DB에서 조회된 토큰:`, tokenEntity);
      throw new Error('GitHub access token not found for user');
    }
    
    console.log(`[GitHub Service] 토큰 조회 성공:`, {
      id: tokenEntity.id,
      user_id: tokenEntity.user_id,
      provider: tokenEntity.provider,
      provider_user_id: tokenEntity.provider_user_id,
      access_token: tokenEntity.access_token ? `${tokenEntity.access_token.substring(0, 10)}...` : 'null',
      connected_at: tokenEntity.connected_at
    });
    
    return {
      Authorization: `token ${tokenEntity.access_token}`,
      Accept: 'application/vnd.github+json',
    };
  }

  /**
   * 깃허브 저장소 정보를 가져오는 메서드입니다.
   * @param owner 깃허브 저장소 소유자 (예: 사용자명 또는 조직명)
   * @param repo 깃허브 저장소 이름
   *
   * owner와 repo는 컨트롤러에서 라우트 파라미터로 전달받습니다.
   * 예시: GET /github/repos/:owner/:repo
   * github.controller.ts에서 @Param('owner') owner, @Param('repo') repo로 받아서 이 함수에 전달합니다.
   */
  async getRepo(owner: string, repo: string, userId: string) {
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}`;
    const response = await this.httpService.get(url, { headers: await this.getHeaders(userId) }).toPromise();
    return response?.data;
  }

  async getBranches(owner: string, repo: string, userId: string) {
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}/branches`;
    const response = await this.httpService.get(url, { headers: await this.getHeaders(userId) }).toPromise();
    return response?.data;
  }

  async getCommits(owner: string, repo: string, userId: string, sha?: string) {
    let url = `${this.githubApiUrl}/repos/${owner}/${repo}/commits`;
    if (sha) {
      url += `?sha=${encodeURIComponent(sha)}`;
    }
    const response = await this.httpService.get(url, { headers: await this.getHeaders(userId) }).toPromise();
    return response?.data;
  }

  async getPulls(owner: string, repo: string, userId: string) {
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}/pulls`;
    const response = await this.httpService.get(url, { headers: await this.getHeaders(userId) }).toPromise();
    return response?.data;
  }

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
        url: `${process.env.WEBHOOK_BASE_URL}/api/github/webhook`,
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

  // github.service.ts
  async getTree(owner: string, repo: string, userId: string, branch: string) {
    // 브랜치의 sha를 먼저 가져옴
    const branchRes = await this.httpService.get(
      `${this.githubApiUrl}/repos/${owner}/${repo}/branches/${branch}`,
      { headers: await this.getHeaders(userId) }
    ).toPromise();
    const sha = branchRes?.data?.commit?.sha;
    if (!sha) throw new Error('브랜치 sha를 찾을 수 없습니다');

    // 트리 정보 요청
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;
    const response = await this.httpService.get(url, { headers: await this.getHeaders(userId) }).toPromise();
    return response?.data;
  }

  /**
   * GitHub 저장소를 생성하는 메서드입니다.
   * @param repoName 저장소 이름
   * @param description 저장소 설명
   * @param isPrivate 비공개 여부
   * @param userId 사용자 ID
   * @param orgName 조직 이름 (선택사항, 없으면 사용자 저장소로 생성)
   */
  async createRepository(repoName: string, description: string, isPrivate: boolean, userId: string, orgName?: string) {
    try {
      console.log(`[GitHub Service] 저장소 생성 시작: ${repoName}, 사용자: ${userId}, 조직: ${orgName || '사용자'}`);
      
      // 사용자 토큰 확인
      const tokenEntity = await this.githubTokenRepository.findOne({ where: { user_id: userId, provider: 'github' } });
      if (!tokenEntity) {
        console.error(`[GitHub Service] 사용자 ${userId}의 GitHub 토큰을 찾을 수 없습니다`);
        throw new Error('GitHub access token not found for user');
      }
      
      console.log(`[GitHub Service] 토큰 확인 완료: ${tokenEntity.access_token.substring(0, 10)}...`);
      
      // 먼저 사용자 정보를 가져와서 권한 확인
      const userInfo = await this.getUserInfo(userId);
      console.log(`[GitHub Service] 사용자 정보:`, userInfo);
      
      const data = {
        name: repoName,
        description: description,
        private: isPrivate,
        auto_init: true, // README 파일 자동 생성
      };
      
      let url: string;
      if (orgName) {
        // 조직 저장소 생성
        url = `${this.githubApiUrl}/orgs/${orgName}/repos`;
        console.log(`[GitHub Service] 조직 저장소 생성: ${url}`);
      } else {
        // 사용자 저장소 생성
        url = `${this.githubApiUrl}/user/repos`;
        console.log(`[GitHub Service] 사용자 저장소 생성: ${url}`);
      }
      
      console.log(`[GitHub Service] GitHub API 요청: ${url}`);
      console.log(`[GitHub Service] 요청 데이터:`, data);
      
      const headers = await this.getHeaders(userId);
      console.log(`[GitHub Service] 요청 헤더:`, { 
        Authorization: headers.Authorization ? 'Bearer [HIDDEN]' : 'Not set',
        Accept: headers.Accept 
      });
      
      const response = await this.httpService.post(url, data, { headers }).toPromise();
      
      console.log(`[GitHub Service] GitHub API 응답 성공:`, response?.data);
      return response?.data;
      
    } catch (error) {
      console.error(`[GitHub Service] 저장소 생성 실패:`, error);
      
      if (error.response) {
        console.error(`[GitHub Service] GitHub API 응답 오류:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // GitHub API 오류 메시지 추출
        if (error.response.data && error.response.data.message) {
          const errorMessage = error.response.data.message;
          
          // 권한 관련 오류 처리
          if (errorMessage.includes('Not Found') || errorMessage.includes('404')) {
            const orgText = orgName ? `조직 '${orgName}'에 대한 ` : '';
            throw new Error(`GitHub API 권한 오류: ${orgText}저장소 생성 권한이 없습니다. GitHub OAuth에서 'repo' 권한을 확인해주세요.`);
          }
          
          throw new Error(`GitHub API 오류: ${errorMessage}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * 사용자의 GitHub 사용자명을 가져오는 메서드입니다.
   * @param userId 사용자 ID
   */
  async getUserInfo(userId: string) {
    const url = `${this.githubApiUrl}/user`;
    const response = await this.httpService.get(url, { 
      headers: await this.getHeaders(userId) 
    }).toPromise();
    
    return response?.data;
  }

  async getTokenScopes(accessToken: string): Promise<string[]> {
    const response = await this.httpService.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'CodePlanner-App'
      }
    }).toPromise();

    if (!response?.data) {
      throw new Error(`GitHub 토큰 상태 조회 실패`);
    }

    // GitHub이 응답 헤더에 붙여주는 스코프 목록 (comma-separated)
    const scopesHeader = response.headers['x-oauth-scopes'] || '';
    return scopesHeader.split(',').map(s => s.trim()).filter(Boolean);
  }
}

