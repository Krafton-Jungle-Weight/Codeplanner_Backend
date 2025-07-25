import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Octokit } from 'octokit';
import { GithubToken } from './github.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import { detectLanguage } from './github.utils';
import { ChangedFileWithContent } from './dto/github.dto';
import * as parseLinkHeader from 'parse-link-header';
import { UserService } from 'src/user/user.service';

@Injectable()
export class GithubService {
  private readonly githubApiUrl = 'https://api.github.com';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(GithubToken)
    private githubTokenRepository: Repository<GithubToken>,
    private readonly userService: UserService,
  ) {}

  private async getHeaders(userId: string) {
    // console.log(`[GitHub Service] 토큰 조회 시작: 사용자 ID ${userId}`);
    const tokenEntity = await this.githubTokenRepository.findOne({
      where: { user_id: userId, provider: 'github' },
    });

    if (!tokenEntity) {
      throw new Error('GitHub access token not found for user');
    }

    // console.log(`[GitHub Service] 토큰 조회 성공:`, {
    //   id: tokenEntity.id,
    //   user_id: tokenEntity.user_id,
    //   provider: tokenEntity.provider,
    //   provider_user_id: tokenEntity.provider_user_id,
    //   access_token: tokenEntity.access_token
    //     ? `${tokenEntity.access_token.substring(0, 10)}...`
    //     : 'null',
    //   connected_at: tokenEntity.connected_at,
    // });

    return {
      Authorization: `token ${tokenEntity.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'CodePlanner-App'
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
    const response = await this.httpService
      .get(url, { headers: await this.getHeaders(userId) })
      .toPromise();
    return response?.data;
  }

  async getBranches(owner: string, repo: string, userId: string) {
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}/branches`;
    const response = await this.httpService
      .get(url, { headers: await this.getHeaders(userId) })
      .toPromise();
    return response?.data;
  }

  async getCommits(owner: string, repo: string, userId: string, sha?: string) {
    let url = `${this.githubApiUrl}/repos/${owner}/${repo}/commits`;
    if (sha) {
      url += `?sha=${encodeURIComponent(sha)}`;
    }
    const response = await this.httpService
      .get(url, { headers: await this.getHeaders(userId) })
      .toPromise();
    return response?.data;
  }

  async getPulls(owner: string, repo: string, userId: string) {
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}/pulls`;
    const response = await this.httpService
      .get(url, { headers: await this.getHeaders(userId) })
      .toPromise();
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

  async connect(owner: string, repo: string, user: User) {
    // console.log('owner', owner);
    // console.log('repo', repo);
    // console.log('user', user);
    const githubToken = await this.githubTokenRepository.findOne({
      where: { user_id: user.id },
    });

    if (!githubToken) {
      throw new NotFoundException('Github token not found');
    }
    // console.log('githubToken: ', githubToken.access_token);

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
        url: `${process.env.WEBHOOK_BASE_URL}/github/webhook`,
        content_type: 'json',
        insecure_ssl: '0',
      },
    });
    // console.log('response', response);
    if (response.status === 201) {
      // console.log('Webhook created successfully');

      return response;
    } else {
      throw new Error('Failed to create webhook');
    }
  }

  // github.service.ts
  async getTree(owner: string, repo: string, userId: string, branch: string) {
    // 브랜치의 sha를 먼저 가져옴
    const branchRes = await this.httpService
      .get(`${this.githubApiUrl}/repos/${owner}/${repo}/branches/${branch}`, {
        headers: await this.getHeaders(userId),
      })
      .toPromise();
    const sha = branchRes?.data?.commit?.sha;
    if (!sha) throw new Error('브랜치 sha를 찾을 수 없습니다');

    // 트리 정보 요청
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;
    const response = await this.httpService
      .get(url, { headers: await this.getHeaders(userId) })
      .toPromise();
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
  async createRepository(
    repoName: string,
    description: string,
    isPrivate: boolean,
    userId: string,
    orgName?: string,
  ) {
    try {
      // console.log(
      //   `[GitHub Service] 저장소 생성 시작: ${repoName}, 사용자: ${userId}, 조직: ${orgName || '사용자'}`,
      // );

      // 사용자 토큰 확인
      const tokenEntity = await this.githubTokenRepository.findOne({
        where: { user_id: userId, provider: 'github' },
      });
      if (!tokenEntity) {
        // console.error(
        //   `[GitHub Service] 사용자 ${userId}의 GitHub 토큰을 찾을 수 없습니다`,
        // );
        throw new Error('GitHub access token not found for user');
      }

      // console.log(
      //   `[GitHub Service] 토큰 확인 완료: ${tokenEntity.access_token.substring(0, 10)}...`,
      // );

      // 먼저 사용자 정보를 가져와서 권한 확인
      const userInfo = await this.getUserInfo(userId);
      // console.log(`[GitHub Service] 사용자 정보:`, userInfo);
      
      // 조직 저장소 생성인 경우 권한 확인
      if (orgName) {
        try {
          // 사용자가 속한 조직 목록에서 해당 조직이 있는지 확인
          const userOrgs = await this.getUserOrganizations(userId);
          const targetOrg = userOrgs.find(org => org.login === orgName);
          
          if (!targetOrg) {
            throw new Error(`조직 '${orgName}'의 멤버가 아닙니다.`);
          }
          
          // 조직의 저장소 생성 권한을 상세히 확인
          const permissionCheck = await this.checkOrganizationRepoCreationPermission(userId, orgName);
          // console.log(`[GitHub Service] 조직 권한 확인 완료:`, permissionCheck);
          
        } catch (permissionError) {
          // console.error(`[GitHub Service] 조직 권한 확인 실패:`, permissionError);
          
          // 권한 문제인 경우 도움말 정보 제공
          const helpInfo = this.getOrganizationPermissionHelp(orgName);
          throw new Error(`조직 '${orgName}' 저장소 생성 권한 확인 실패: ${permissionError.message}\n\n도움말: ${helpInfo.settingsUrl}`);
        }
      }
      


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
        // console.log(`[GitHub Service] 조직 저장소 생성: ${url}`);
      } else {
        // 사용자 저장소 생성
        url = `${this.githubApiUrl}/user/repos`;
        // console.log(`[GitHub Service] 사용자 저장소 생성: ${url}`);
      }


      // console.log(`[GitHub Service] GitHub API 요청: ${url}`);
      // console.log(`[GitHub Service] 요청 데이터:`, data);

      const headers = await this.getHeaders(userId);
      // console.log(`[GitHub Service] 요청 헤더:`, {
      //   Authorization: headers.Authorization ? 'Bearer [HIDDEN]' : 'Not set',
      //   Accept: headers.Accept,
      // });

      const response = await this.httpService
        .post(url, data, { headers })
        .toPromise();

      // console.log(`[GitHub Service] GitHub API 응답 성공:`, response?.data);
      return response?.data;
    } catch (error) {
      // console.error(`[GitHub Service] 저장소 생성 실패:`, error);

      if (error.response) {
        // console.error(`[GitHub Service] GitHub API 응답 오류:`, {
        //   status: error.response.status,
        //   statusText: error.response.statusText,
        //   data: error.response.data,
        // });

        // GitHub API 오류 메시지 추출
        if (error.response.data && error.response.data.message) {
          const errorMessage = error.response.data.message;

          // 권한 관련 오류 처리
          if (
            errorMessage.includes('Not Found') ||
            errorMessage.includes('404')
          ) {
            const orgText = orgName ? `조직 '${orgName}'에 대한 ` : '';
            throw new Error(
              `GitHub API 권한 오류: ${orgText}저장소 생성 권한이 없습니다. GitHub OAuth에서 'repo' 권한을 확인해주세요.`,
            );
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
    const response = await this.httpService
      .get(url, {
        headers: await this.getHeaders(userId),
      })
      .toPromise();

    return response?.data;
  }

  /**
   * 사용자가 속한 조직 목록을 가져오는 메서드입니다.
   * @param userId 사용자 ID
   */
  async getUserOrganizations(userId: string) {
    try {
      // console.log(`[GitHub Service] 사용자 조직 목록 조회 시작: ${userId}`);
      
      // /user/memberships/orgs 엔드포인트를 사용하여 모든 멤버십 상태의 조직 가져오기
      const url = `${this.githubApiUrl}/user/memberships/orgs`;
      // console.log(`[GitHub Service] GitHub API 호출 URL: ${url}`);
      
      const headers = await this.getHeaders(userId);
      // console.log(`[GitHub Service] 요청 헤더:`, {
      //   Authorization: headers.Authorization ? 'Bearer [HIDDEN]' : 'Not set',
      //   Accept: headers.Accept
      // });
      
      const response = await this.httpService.get(url, { 
        headers 
      }).toPromise();
      
      const memberships = response?.data || [];
      // console.log(`[GitHub Service] 조직 멤버십 조회 성공: ${memberships.length}개 조직`);
      // console.log(`[GitHub Service] 응답 상태: ${response?.status}`);
      
      // 멤버십 정보에서 조직 정보 추출
      const organizations = memberships.map((membership: any) => ({
        login: membership.organization.login,
        id: membership.organization.id,
        avatar_url: membership.organization.avatar_url,
        description: membership.organization.description,
        url: membership.organization.url,
        html_url: membership.organization.html_url,
        role: membership.role,
        state: membership.state
      }));

      // console.log(`[GitHub Service] 추출된 조직 목록:`, organizations.map(org => ({
      //   login: org.login,
      //   role: org.role,
      //   state: org.state
      // })));

      // 각 조직의 저장소 생성 권한을 확인
      const organizationsWithPermissions = await Promise.all(
        organizations.map(async (org) => {
          try {
            const permissionCheck = await this.checkOrganizationRepoCreationPermission(userId, org.login);
            return {
              ...org,
              canCreateRepo: permissionCheck.canCreateRepo,
              role: permissionCheck.role,
              state: permissionCheck.state,
              permissionError: null
            };
          } catch (error) {
            // console.log(`[GitHub Service] 조직 ${org.login} 권한 확인 실패:`, error.message);
            return {
              ...org,
              canCreateRepo: false,
              role: org.role, // 멤버십에서 가져온 역할 사용
              state: org.state, // 멤버십에서 가져온 상태 사용
              permissionError: error.message
            };
          }
        })
      );
      
      // console.log(`[GitHub Service] 최종 조직 목록 (권한 포함):`, organizationsWithPermissions.map(org => ({
      //   login: org.login,
      //   canCreateRepo: org.canCreateRepo,
      //   role: org.role,
      //   state: org.state,
      //   permissionError: org.permissionError
      // })));
      
      return organizationsWithPermissions;
      
    } catch (error) {
      // console.error(`[GitHub Service] 조직 목록 조회 실패:`, error);
      // console.error(`[GitHub Service] 오류 상세 정보:`, {
      //   message: error.message,
      //   stack: error.stack,
      //   response: error.response?.data,
      //   status: error.response?.status,
      //   statusText: error.response?.statusText
      // });
      
      // GitHub API 오류 응답 확인
      if (error.response) {
        // console.error(`[GitHub Service] GitHub API 응답 오류:`, {
        //   status: error.response.status,
        //   statusText: error.response.statusText,
        //   data: error.response.data
        // });
        
        // 권한 관련 오류 처리
        if (error.response.status === 403) {
          throw new Error(`조직 목록 조회 권한이 없습니다. GitHub OAuth에서 'read:org' 권한을 확인해주세요.`);
        } else if (error.response.status === 401) {
          throw new Error(`GitHub 토큰이 만료되었습니다. GitHub OAuth를 다시 진행해주세요.`);
        }
      }
      
      throw new Error(`조직 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 조직의 저장소 생성 권한을 확인하는 메서드입니다.
   * @param userId 사용자 ID
   * @param orgName 조직 이름
   */
  async checkOrganizationRepoCreationPermission(userId: string, orgName: string) {
    try {
      // console.log(`[GitHub Service] 조직 '${orgName}' 저장소 생성 권한 확인 중...`);
      
      // 먼저 사용자 정보를 가져와서 GitHub 사용자명 확인
      const userInfo = await this.getUserInfo(userId);
      const githubUsername = userInfo.login;
      // console.log(`[GitHub Service] GitHub 사용자명: ${githubUsername}`);
      
      // 조직 정보 조회
      const url = `${this.githubApiUrl}/orgs/${orgName}`;
      const response = await this.httpService.get(url, { 
        headers: await this.getHeaders(userId) 
      }).toPromise();
      
      const orgInfo = response?.data;
      // console.log(`[GitHub Service] 조직 정보:`, orgInfo);
      
      // 조직이 저장소 생성을 허용하는지 확인
      if (orgInfo.has_organization_projects === false) {
        throw new Error(`조직 '${orgName}'에서 저장소 생성이 제한되어 있습니다.`);
      }
      
      // 조직 멤버십 정보 조회 (실제 GitHub 사용자명 사용)
      const membershipUrl = `${this.githubApiUrl}/orgs/${orgName}/memberships/${githubUsername}`;
      // console.log(`[GitHub Service] 멤버십 확인 URL: ${membershipUrl}`);
      const membershipResponse = await this.httpService.get(membershipUrl, { 
        headers: await this.getHeaders(userId) 
      }).toPromise();
      
      const membership = membershipResponse?.data;
      // console.log(`[GitHub Service] 조직 멤버십 정보:`, membership);
      
      // 멤버십 상태 확인
      if (membership.state !== 'active') {
        throw new Error(`조직 '${orgName}' 멤버십이 활성화되지 않았습니다. (상태: ${membership.state})`);
      }
      
      // 역할 확인 (admin, member, billing_manager)
      if (membership.role === 'billing_manager') {
        throw new Error(`조직 '${orgName}'에서 저장소를 생성할 권한이 없습니다. (역할: ${membership.role})`);
      }
      
      return {
        canCreateRepo: true,
        role: membership.role,
        state: membership.state,
        organization: orgInfo
      };
      
    } catch (error) {
      // console.error(`[GitHub Service] 조직 저장소 생성 권한 확인 실패:`, error);
      
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error(`조직 '${orgName}'을 찾을 수 없거나 접근 권한이 없습니다.`);
        } else if (error.response.status === 403) {
          // 403 오류의 경우 비공개 조직일 가능성이 높음
          throw new Error(`조직 '${orgName}'에 대한 접근이 제한되어 있습니다. 비공개 조직의 경우 조직 관리자에게 문의하세요.`);
        }
      }
      
      throw error;
    }
  }

  /**
   * 조직에 저장소 생성 권한 요청을 위한 안내 정보를 제공하는 메서드입니다.
   * @param orgName 조직 이름
   */
  getOrganizationPermissionHelp(orgName: string) {
    return {
      organization: orgName,
      helpSteps: [
        {
          step: 1,
          title: "조직 멤버십 확인",
          description: `먼저 조직 '${orgName}'의 멤버인지 확인하세요. 비공개 조직의 경우 멤버십이 필요합니다.`
        },
        {
          step: 2,
          title: "조직 설정 확인",
          description: `GitHub에서 조직 '${orgName}'의 Settings > Member privileges로 이동하세요.`
        },
        {
          step: 3,
          title: "저장소 생성 권한 확인",
          description: "Repository creation 권한이 'Members' 또는 'All members'로 설정되어 있는지 확인하세요."
        },
        {
          step: 4,
          title: "외부 앱 접근 허용",
          description: "Third-party application access policy에서 외부 앱 접근을 허용하도록 설정하세요."
        },
        {
          step: 5,
          title: "GitHub OAuth 권한 확인",
          description: "GitHub OAuth에서 'repo' 및 'read:org' 권한이 부여되었는지 확인하세요."
        },
        {
          step: 6,
          title: "조직 관리자에게 문의",
          description: "위 설정이 제한되어 있다면 조직 관리자에게 권한 요청을 하세요."
        }
      ],
      settingsUrl: `https://github.com/organizations/${orgName}/settings/member-privileges`,
      helpUrl: "https://docs.github.com/ko/organizations/managing-organization-settings/managing-member-privileges-for-your-organization",
      oauthSettingsUrl: "https://github.com/settings/applications",
      organizationUrl: `https://github.com/organizations/${orgName}`
    };
  }


  /**
   * 이슈 제목을 기반으로 브랜치를 생성하는 메서드입니다.
   * @param userId 사용자 ID
   * @param owner 저장소 소유자
   * @param repo 저장소 이름
   * @param issueTitle 이슈 제목
   * @param baseBranch 기본 브랜치 (보통 main 또는 master)
   */
  async createBranchFromIssue(userId: string, owner: string, repo: string, issueTitle: string, baseBranch: string = 'main') {
    try {
      // console.log(`[GitHub Service] 브랜치 생성 시작: ${owner}/${repo}, 이슈: ${issueTitle}`);
      
      // 이슈 제목을 브랜치 이름으로 변환
      const branchName = this.generateBranchName(issueTitle);
      // console.log(`[GitHub Service] 생성될 브랜치 이름: ${branchName}`);
      
      // 1. 저장소 접근 권한 확인
      try {
        const repoUrl = `${this.githubApiUrl}/repos/${owner}/${repo}`;
        const repoResponse = await this.httpService.get(repoUrl, { 
          headers: await this.getHeaders(userId) 
        }).toPromise();
        
        if (!repoResponse?.data) {
          throw new Error(`저장소 '${owner}/${repo}'에 접근할 수 없습니다.`);
        }
        
        // console.log(`[GitHub Service] 저장소 접근 확인: ${repoResponse.data.full_name}`);
      } catch (repoError) {
        // console.error(`[GitHub Service] 저장소 접근 확인 실패:`, repoError);
        
        if (repoError.response?.status === 404) {
          throw new Error(`저장소 '${owner}/${repo}'를 찾을 수 없습니다. 저장소 이름과 소유자를 확인해주세요.`);
        } else if (repoError.response?.status === 403) {
          throw new Error(`저장소 '${owner}/${repo}'에 대한 접근 권한이 없습니다. 저장소가 비공개인 경우 소유자에게 접근 권한을 요청하세요.`);
        } else if (repoError.response?.status === 401) {
          throw new Error(`GitHub 인증이 만료되었습니다. GitHub OAuth를 다시 연결해주세요.`);
        }
        
        throw new Error(`저장소 접근 확인 실패: ${repoError.message}`);
      }
      
      // 2. 기본 브랜치의 최신 커밋 SHA 가져오기
      const branchUrl = `${this.githubApiUrl}/repos/${owner}/${repo}/branches/${baseBranch}`;
      const branchResponse = await this.httpService.get(branchUrl, { 
        headers: await this.getHeaders(userId) 
      }).toPromise();
      
      if (!branchResponse?.data?.commit?.sha) {
        throw new Error(`기본 브랜치 '${baseBranch}'의 SHA를 찾을 수 없습니다. 저장소에 기본 브랜치가 존재하는지 확인해주세요.`);
      }
      
      const baseSha = branchResponse.data.commit.sha;
      // console.log(`[GitHub Service] 기본 브랜치 SHA: ${baseSha}`);
      
      // 3. 새 브랜치 생성
      const createBranchUrl = `${this.githubApiUrl}/repos/${owner}/${repo}/git/refs`;
      const createBranchResponse = await this.httpService.post(
        createBranchUrl,
        {
          ref: `refs/heads/${branchName}`,
          sha: baseSha
        },
        { 
          headers: await this.getHeaders(userId) 
        }
      ).toPromise();
      
      if (createBranchResponse?.status !== 201) {
        throw new Error('브랜치 생성에 실패했습니다.');
      }
      
      // console.log(`[GitHub Service] 브랜치 생성 성공: ${branchName}`);
      
      return {
        branchName,
        branchUrl: `https://github.com/${owner}/${repo}/tree/${branchName}`,
        ref: createBranchResponse.data.ref,
        sha: createBranchResponse.data.object.sha
      };
      
    } catch (error) {
      // console.error(`[GitHub Service] 브랜치 생성 실패:`, error);
      
      if (error.response) {
        if (error.response.status === 422) {
          throw new Error(`브랜치 '${this.generateBranchName(issueTitle)}'가 이미 존재합니다.`);
        } else if (error.response.status === 404) {
          throw new Error(`저장소 '${owner}/${repo}'를 찾을 수 없거나 접근 권한이 없습니다.`);
        } else if (error.response.status === 403) {
          throw new Error(`브랜치 생성 권한이 없습니다. GitHub OAuth에서 'repo' 권한을 확인해주세요.`);
        } else if (error.response.status === 401) {
          throw new Error(`GitHub 인증이 만료되었습니다. GitHub OAuth를 다시 연결해주세요.`);
        }
      }
      
      // 이미 처리된 오류는 그대로 전달
      if (error.message.includes('저장소') || error.message.includes('GitHub 인증') || error.message.includes('브랜치')) {
        throw error;
      }
      
      throw new Error(`브랜치 생성 실패: ${error.message}`);
    }
  }

  /**
   * 이슈 제목을 브랜치 이름으로 변환하는 메서드입니다.
   * @param issueTitle 이슈 제목
   * @returns 브랜치 이름
   */
  private generateBranchName(issueTitle: string): string {
    // 브랜치 이름 규칙:
    // 1. 소문자로 변환
    // 2. 특수문자 제거 (하이픈, 언더스코어는 유지)
    // 3. 공백을 하이픈으로 변환
    // 4. 길이 제한 (50자)
    // 5. 접두사 추가 (feature/)
    
    let branchName = issueTitle
      .replace(/\s+/g, '-') // 공백을 하이픈으로 변환
      .replace(/-+/g, '-') // 연속된 하이픈을 하나로
      .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
    
    // 길이 제한 (feature/ 접두사 고려)
    if (branchName.length > 40) {
      branchName = branchName.substring(0, 40);
      // 마지막 하이픈 이후 잘린 경우 하이픈 제거
      branchName = branchName.replace(/-[^-]*$/, '');
    }
    
    // 접두사 추가
    return `feature/${branchName}`;
  }

  async getTokenScopes(accessToken: string): Promise<string[]> {
    const response = await this.httpService
      .get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'CodePlanner-App',
        },
      })
      .toPromise();

    if (!response?.data) {
      throw new Error(`GitHub 토큰 상태 조회 실패`);
    }

    // GitHub이 응답 헤더에 붙여주는 스코프 목록 (comma-separated)
    const scopesHeader = response.headers['x-oauth-scopes'] || '';
    return scopesHeader
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async getChangedFilesWithContent(
    owner: string,
    repo: string,
    commitSha: string,
    userId: string,
    since?: string, // 특정 시점 이후의 변경사항만 가져오기 위한 파라미터
  ) {
    const headers = await this.getHeaders(userId);

    // 1. 커밋에서 변경된 파일 목록 얻기
    const commitUrl = `${this.githubApiUrl}/repos/${owner}/${repo}/commits/${commitSha}`;
    const commitRes = await this.httpService
      .get(commitUrl, { headers })
      .toPromise();

    const files = commitRes?.data?.files;
    if (!files || files.length === 0) {
      throw new Error('변경된 파일이 없습니다.');
    }

    // since 파라미터가 있으면 해당 시점 이후의 변경사항만 필터링
    let filteredFiles = files;
    if (since) {
      // 커밋 날짜가 since 이후인지 확인
      const commitDate = new Date(commitRes.data.commit.author.date);
      const sinceDate = new Date(since);
      if (commitDate < sinceDate) {
        throw new Error('지정된 시점 이후의 변경사항이 없습니다.');
      }
    }

    type ChangedFileWithContent = {
      filename: string;
      status: 'added' | 'modified' | 'removed'; // 깃허브 커밋 파일 상태
      language: 'c' | 'cpp' | 'text' | 'unknown';
      content: string;
      error?: string; // 선택값으로 변경!
    };

    // 2. 각 파일의 내용 가져오기
    const results: ChangedFileWithContent[] = [];

    for (const file of filteredFiles) {
      const filePath = file.filename;

      const contentUrl = `${this.githubApiUrl}/repos/${owner}/${repo}/contents/${filePath}?ref=${commitSha}`;
      try { 
        const contentRes = await this.httpService
          .get(contentUrl, { headers })
          .toPromise();
        const encoded = contentRes?.data?.content;
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
        
        results.push({
          filename: filePath,
          status: file.status, // added, modified, removed
          language: filePath.endsWith('.c')
            ? 'c'
            : filePath.endsWith('.cpp')
              ? 'cpp'
              : 'text',
          content: decoded,
        });
      } catch (err) {
        // console.error(`파일 ${filePath} 읽기 실패`, err.message);
        // 실패한 파일도 기록해줄 수 있음
        results.push({
          filename: filePath,
          status: file.status,
          language: 'unknown',
          content: '',
          error: err.message,
        });
      }
    }
    return results;
  }

  async getFilesChangedInPullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    userId: string,
  ): Promise<ChangedFileWithContent[]> {
    const headers = await this.getHeaders(userId);
    const allResults: ChangedFileWithContent[] = [];

    // 1. PR에 포함된 커밋들 가져오기
    const commitsUrl = `${this.githubApiUrl}/repos/${owner}/${repo}/pulls/${pullNumber}/commits`;
    const commitsRes = await this.httpService
      .get(commitsUrl, { headers })
      .toPromise();
    const commits = commitsRes?.data;

    if (!commits || commits.length === 0) {
      throw new Error('PR에 포함된 커밋이 없습니다.');
    }

    // 2. 커밋별로 변경된 파일들을 쭉 순회
    for (const commit of commits) {
      const sha = commit.sha;
      const commitUrl = `${this.githubApiUrl}/repos/${owner}/${repo}/commits/${sha}`;
      const commitRes = await this.httpService
        .get(commitUrl, { headers })
        .toPromise();

      const files = commitRes?.data?.files;
      if (!files) continue;

      for (const file of files) {
        const path = file.filename;

        // 중복 검사 방지: 이미 처리한 파일은 건너뜀
        if (allResults.find((r) => r.filename === path)) continue;

        try {
          const contentUrl = `${this.githubApiUrl}/repos/${owner}/${repo}/contents/${path}?ref=${sha}`;
          const contentRes = await this.httpService
            .get(contentUrl, { headers })
            .toPromise();
          const encoded = contentRes?.data?.content;
          const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
          // console.log("qewrqwr : ", path);
          // console.log("func : ", detectLanguage(path));
          allResults.push({
            filename: path,
            status: file.status,
            language: detectLanguage(path),
            content: decoded,
          });
        } catch (err) {
          allResults.push({
            filename: path,
            status: file.status,
            language: 'unknown',
            content: '',
            error: err.message,
          });
        }
      }
    }

    return allResults;
  }
  async getUserIdFromGithubWebhookSender(sender: { id: number; login: string }): Promise<string> {
    const { id, login } = sender;

    const tokenEntity = await this.githubTokenRepository.findOne({
      where: [
        { provider: 'github', github_login: login },
        { provider: 'github', github_id: id.toString() },
      ],
    });

    if (!tokenEntity) {
      throw new Error(`GitHub sender (${login}/${id}) 에 해당하는 사용자를 찾을 수 없습니다.`);
    }

    return tokenEntity.user_id;
  }

  async getGithubLoginByUserId(userId: string): Promise<string | null> {
    const tokenEntity = await this.githubTokenRepository.findOne({
      where: { user_id: userId, provider: 'github' },
    });
    if (!tokenEntity) return null;
    if (tokenEntity.github_login) return tokenEntity.github_login;
    // 만약 github_login이 없다면 provider_user_id를 반환(대부분 login임)
    return tokenEntity.provider_user_id || null;
  }

  // PR 기준으로 최근 변경사항만 가져오기 (중복 제거)
  async getRecentChangedFilesInPullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    userId: string,
  ) {
    const headers = await this.getHeaders(userId);

    // 1. PR에 포함된 커밋들 가져오기 (시간순 정렬)
    const commitsUrl = `${this.githubApiUrl}/repos/${owner}/${repo}/pulls/${pullNumber}/commits`;
    const commitsRes = await this.httpService.get(commitsUrl, { headers }).toPromise();
    const commits = commitsRes?.data;

    if (!commits || commits.length === 0) {
      throw new Error('PR에 포함된 커밋이 없습니다.');
    }

    // 커밋을 시간순으로 정렬 (최신이 먼저)
    const sortedCommits = commits.sort((a, b) => 
      new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()
    );

    // 2. 각 커밋의 변경된 파일들을 수집 (최신 커밋 우선)
    const fileMap = new Map<string, any>(); // filename -> file info

    for (const commit of sortedCommits) {
      const commitUrl = `${this.githubApiUrl}/repos/${owner}/${repo}/commits/${commit.sha}`;
      const commitRes = await this.httpService.get(commitUrl, { headers }).toPromise();
      const files = commitRes?.data?.files;

      if (!files) continue;

      for (const file of files) {
        // 이미 처리된 파일이면 건너뛰기 (최신 커밋이 이미 처리됨)
        if (fileMap.has(file.filename)) {
          continue;
        }

        // 최신 커밋의 파일 정보 저장
        fileMap.set(file.filename, {
          ...file,
          commitSha: commit.sha,
          commitMessage: commit.commit.message,
          commitDate: commit.commit.author.date,
        });
      }
    }

    // 3. 파일 내용 가져오기 (최신 커밋의 내용)
    const results: Array<{
      filename: string;
      status: 'added' | 'modified' | 'removed';
      language: 'c' | 'cpp' | 'text' | 'unknown';
      content: string;
      error?: string;
      commitSha: string;
      commitMessage: string;
      commitDate: string;
    }> = [];

    for (const [filename, fileInfo] of fileMap) {
      const contentUrl = `${this.githubApiUrl}/repos/${owner}/${repo}/contents/${filename}?ref=${fileInfo.commitSha}`;
      try {
        const contentRes = await this.httpService.get(contentUrl, { headers }).toPromise();
        const encoded = contentRes?.data?.content;
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8');

        results.push({
          filename,
          status: fileInfo.status,
          language: filename.endsWith('.c')
            ? 'c'
            : filename.endsWith('.cpp')
              ? 'cpp'
              : 'text',
          content: decoded,
          commitSha: fileInfo.commitSha,
          commitMessage: fileInfo.commitMessage,
          commitDate: fileInfo.commitDate,
        });
      } catch (err) {
        // console.error(`파일 ${filename} 읽기 실패`, err.message);
        results.push({
          filename,
          status: fileInfo.status,
          language: 'unknown',
          content: '',
          error: err.message,
          commitSha: fileInfo.commitSha,
          commitMessage: fileInfo.commitMessage,
          commitDate: fileInfo.commitDate,
        });
      }
    }

    return results;
  }

  /**
   * summaryai 전용: 모든 PR(state=all) 반환
   */
  async getAllPullsForSummaryAI(owner: string, repo: string, userId: string) {
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}/pulls?state=all`;
    const response = await this.httpService
      .get(url, { headers: await this.getHeaders(userId) })
      .toPromise();
    return response?.data;
  }

  /**
   * summaryai 전용: 모든 커밋 반환(필요시 추가 옵션 가능)
   */
  async getAllCommitsForSummaryAI(owner: string, repo: string, userId: string, sha?: string) {
    let url = `${this.githubApiUrl}/repos/${owner}/${repo}/commits`;
    if (sha) {
      url += `?sha=${encodeURIComponent(sha)}`;
    }
    const response = await this.httpService
      .get(url, { headers: await this.getHeaders(userId) })
      .toPromise();
    return response?.data;
  }

  /**
   * 깃허브 저장소의 전체 커밋 개수만 반환 (REST API, per_page=1, Link 헤더 활용)
   */
  async getTotalCommitCount(owner: string, repo: string, userId: string): Promise<number> {
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}/commits?per_page=1`;
    const response = await this.httpService
      .get(url, { headers: await this.getHeaders(userId) })
      .toPromise();
    // console.log('[getTotalCommitCount] status:', response?.status);
    // console.log('[getTotalCommitCount] headers:', response?.headers);
    // console.log('[getTotalCommitCount] data:', response?.data);
    const link = response?.headers?.link;
    // console.log('[getTotalCommitCount] link:', link);
    if (link) {
      const parsed = parseLinkHeader(link);
      // console.log('[getTotalCommitCount] parsed link:', parsed);
      if (parsed && parsed.last && parsed.last.page) {
        return parseInt(parsed.last.page, 10);
      }
    }
    // Link 헤더가 없으면 커밋이 1개 이하임
    return Array.isArray(response?.data) ? response.data.length : 0;
  }

  /**
   * 깃허브 저장소의 전체 PR 개수만 반환 (REST API, per_page=1, Link 헤더 활용)
   */
  async getTotalPullRequestCount(owner: string, repo: string, userId: string): Promise<number> {
    const url = `${this.githubApiUrl}/repos/${owner}/${repo}/pulls?state=all&per_page=1`;
    const response = await this.httpService
      .get(url, { headers: await this.getHeaders(userId) })
      .toPromise();
    // console.log('[getTotalPullRequestCount] status:', response?.status);
    // console.log('[getTotalPullRequestCount] headers:', response?.headers);
    // console.log('[getTotalPullRequestCount] data:', response?.data);
    const link = response?.headers?.link;
    // console.log('[getTotalPullRequestCount] link:', link);
    if (link) {
      const parsed = parseLinkHeader(link);
      // console.log('[getTotalPullRequestCount] parsed link:', parsed);
      if (parsed && parsed.last && parsed.last.page) {
        return parseInt(parsed.last.page, 10);
      }
    }
    // Link 헤더가 없으면 PR이 1개 이하임
    return Array.isArray(response?.data) ? response.data.length : 0;
  }

  async getFileContents(
    owner: string,
    repo: string,
    sha: string,
    filePath: string,
    userId: string,
  ): Promise<{ content: string }> {
    const headers = await this.getHeaders(userId);
    const contentUrl = `${this.githubApiUrl}/repos/${owner}/${repo}/contents/${filePath}?ref=${sha}`;
    try {
      const contentRes = await this.httpService.get(contentUrl, { headers }).toPromise();
      const encoded = contentRes?.data?.content;
      if (!encoded) {
        throw new Error('파일 내용을 찾을 수 없습니다.');
      }
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      return { content: decoded };
    } catch (err) {
      // console.error(`파일 ${filePath} 읽기 실패`, err.message);
      throw new Error(`파일 ${filePath} 읽기 실패: ${err.message}`);
    }
  }

  /**
   * 전체 커밋 중 내 커밋만 반환 (페이지네이션, Link 헤더 기반)
   */
  async getAllMyCommits(owner: string, repo: string, userId: string): Promise<any[]> {
    const githubLogin = await this.getGithubLoginByUserId(userId);
    const userEmail = (await this.userService.myPage(userId))?.email;
    const perPage = 100;
    let allCommits: any[] = [];
    let url = `${this.githubApiUrl}/repos/${owner}/${repo}/commits?per_page=${perPage}&page=1`;
    let hasNext = true;
    let pageCount = 1;
    while (hasNext) {
      const response = await this.httpService
        .get(url, { headers: await this.getHeaders(userId) })
        .toPromise();
      const commits = response?.data;
      // 디버깅용 로그 제거
      // console.log(`[getAllMyCommits] page: ${pageCount}, url: ${url}`);
      // console.log(`[getAllMyCommits] commits this page: ${commits?.length}`);
      // console.log(`[getAllMyCommits] Link header:`, response?.headers?.link);
      if (!commits || commits.length === 0) break;
      // 내 커밋만 필터링
      const myCommits = commits.filter(commit => {
        const authorLogin = commit.author?.login;
        const committerLogin = commit.committer?.login;
        const authorEmail = commit.commit?.author?.email;
        const committerEmail = commit.commit?.committer?.email;
        return (
          (githubLogin && (authorLogin === githubLogin || committerLogin === githubLogin)) ||
          (userEmail && (authorEmail === userEmail || committerEmail === userEmail))
        );
      });
      allCommits = allCommits.concat(myCommits);
      // Link 헤더에서 next 페이지가 있는지 확인
      const link = response?.headers?.link;
      if (link) {
        const parsed = parseLinkHeader(link);
        if (parsed && parsed.next) {
          url = parsed.next.url;
          hasNext = true;
        } else {
          hasNext = false;
        }
      } else {
        hasNext = false;
      }
      pageCount++;
    }
    return allCommits;
  }

  /**
   * 전체 PR 중 내 PR만 반환 (페이지네이션, Link 헤더 기반)
   */
  async getAllMyPulls(owner: string, repo: string, userId: string): Promise<any[]> {
    const githubLogin = await this.getGithubLoginByUserId(userId);
    const perPage = 100;
    let allPRs: any[] = [];
    let url = `${this.githubApiUrl}/repos/${owner}/${repo}/pulls?state=all&per_page=${perPage}&page=1`;
    let hasNext = true;
    while (hasNext) {
      const response = await this.httpService
        .get(url, { headers: await this.getHeaders(userId) })
        .toPromise();
      const pulls = response?.data;
      if (!pulls || pulls.length === 0) break;
      // 내 PR만 필터링
      const myPRs = pulls.filter(pr => {
        const prLogin = pr.user?.login;
        return prLogin === githubLogin;
      });
      allPRs = allPRs.concat(myPRs);
      // Link 헤더에서 next 페이지가 있는지 확인
      const link = response?.headers?.link;
      if (link) {
        const parsed = parseLinkHeader(link);
        if (parsed && parsed.next) {
          url = parsed.next.url;
          hasNext = true;
        } else {
          hasNext = false;
        }
      } else {
        hasNext = false;
      }
    }
    return allPRs;
  }
}
