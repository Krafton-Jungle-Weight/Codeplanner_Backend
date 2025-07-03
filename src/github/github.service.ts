import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class GithubService {
  private readonly githubApiUrl = 'https://api.github.com';

  constructor(private readonly httpService: HttpService) {}

  private getHeaders() {
    return {
      // Authorization: `token ${process.env.GITHUB_TOKEN}`,
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
  async getRepo(owner: string, repo: string) {
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}`;
    // 깃허브 API에 GET 요청을 보내고, 응답 데이터를 반환합니다.
    const response = await this.httpService.get(url, { headers: this.getHeaders() }).toPromise();
    return response?.data;
  }

  async getBranches(owner: string, repo: string) {
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}/branches`;
    const response = await this.httpService.get(url, { headers: this.getHeaders() }).toPromise();
    return response?.data;
  }

  async getCommits(owner: string, repo: string) {
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}/commits`;
    const response = await this.httpService.get(url, { headers: this.getHeaders() }).toPromise();
    return response?.data;
  }

  async getPulls(owner: string, repo: string) {
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}/pulls`;
    const response = await this.httpService.get(url, { headers: this.getHeaders() }).toPromise();
    return response?.data;
  }
}