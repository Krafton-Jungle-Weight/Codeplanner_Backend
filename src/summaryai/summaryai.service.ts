import { Injectable, Inject } from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { IssuesService } from '../issues/issues.service';
import { CommentService } from '../comments/comment.service';
import { ActivityService } from '../activity/activity.service';
import { ProjectService } from '../project/project.service';
import { UserService } from '../user/user.service';
import { 
  ContributionAnalysisRequestDto, 
  ContributionAnalysisResponseDto,
  ActivityData,
  ContributionStats,
  CollaborationFeedback,
  ProjectTimeline
} from './dto/contribution-analysis.dto';
import { ContributionAnalyzer, ContributionMetrics } from './algorithms/contribution-analyzer';
import { parse } from 'path';
import axios from 'axios';

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  // https://github.com/owner/repo(.git) 형태에서 owner/repo 추출
  try {
    const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    return null;
  } catch {
    return null;
  }
}

@Injectable()
export class SummaryaiService {
  constructor(
    @Inject(GithubService)
    private readonly githubService: GithubService,
    
    @Inject(IssuesService)
    private readonly issuesService: IssuesService,
    
    @Inject(CommentService)
    private readonly commentService: CommentService,
    
    @Inject(ActivityService)
    private readonly activityService: ActivityService,
    
    @Inject(ProjectService)
    private readonly projectService: ProjectService,
    
    @Inject(UserService)
    private readonly userService: UserService,
  ) {}

  /**
   * 사용자의 기여도 분석을 수행합니다.
   */
  async analyzeContribution(dto: ContributionAnalysisRequestDto & { includeMergeCommits?: boolean }): Promise<ContributionAnalysisResponseDto> {
    const { projectId, userId, owner, repo, includeMergeCommits = false } = dto;

    // 1. 데이터 수집
    const [userActivities, projectTimeline] = await Promise.all([
      this.collectUserActivities(userId, projectId, owner, repo, includeMergeCommits),
      this.collectProjectTimeline(userId, projectId, owner, repo)
    ]);

    // 2. 통계 계산
    const userStats = this.calculateContributionStats(userActivities, projectTimeline);

    // 3. AI 분석
    const [collaborationFeedback, aiSummary, peerFeedbackSummary] = await Promise.all([
      this.analyzeCollaborationStyle(userActivities),
      this.generateProjectSummary(projectTimeline),
      this.analyzePeerFeedback(userId, projectId)
    ]);

    return {
      projectTimeline,
      userStats,
      userActivities,
      collaborationFeedback,
      aiSummary,
      peerFeedbackSummary
    };
  }

  /**
   * 사용자 활동 데이터를 수집합니다.
   */
  public async collectUserActivities(
    userId: string, 
    projectId: string, 
    owner?: string, 
    repo?: string,
    includeMergeCommits: boolean = false
  ): Promise<ActivityData[]> {
    const activities: ActivityData[] = [];

    // owner/repo가 없으면 projectId로 프로젝트 정보에서 추출
    if (!owner || !repo) {
      try {
        const project = await this.projectService.findOne(projectId);
        if (project && project.repository_url) {
          const parsed = parseGithubUrl(project.repository_url);
          if (parsed) {
            owner = parsed.owner;
            repo = parsed.repo;
          }
        }
      } catch (e) {
        console.error('프로젝트 정보에서 owner/repo 추출 실패:', e);
      }
    }

    // userId로 github_login 조회
    let githubLogin: string | null = null;
    if (owner && repo) {
      try {
        githubLogin = await this.githubService.getGithubLoginByUserId(userId);
      } catch (e) {
        console.error('깃허브 로그인 조회 실패:', e);
      }
    }

    try {
      // 1. 내 이슈만 집계
      const myIssues = await this.issuesService.getIssuesCurrentUser(userId, projectId);
      activities.push(...myIssues.map(issue => ({
        id: issue.id,
        title: issue.title,
        content: issue.description,
        createdAt: new Date(), // 이슈 엔티티에 createdAt이 없으므로 현재 시간 사용
        updatedAt: new Date(),
        closedAt: undefined,
        status: issue.status,
        type: 'issue' as const,
        author: userId
      })));

      // 2. 프로젝트 내 모든 이슈의 댓글 중 내가 쓴 것만 집계
      const allIssues = await this.issuesService.getIssues(projectId);
      const allComments: any[] = [];
      for (const issue of allIssues) {
        try {
          const comments = await this.commentService.getComments(projectId, issue.id);
          console.log(`이슈ID: ${issue.id}에서 가져온 댓글 개수: ${comments.length}`);

          // 각 댓글의 issue.id, 댓글ID, 작성자ID 로그 출력
          comments.forEach(comment => {
            console.log(
              `이슈ID: ${issue.id}, 댓글ID: ${comment.id}, 작성자ID: ${comment.authorId}`
            );
          });
          allComments.push(...comments);
        } catch (error) {
          console.error(`이슈 ${issue.id}의 댓글 수집 실패:`, error);
        }
      }
      // 모든 댓글 중 내가 쓴 것만 필터링
      const userComments = allComments.filter(comment => comment.authorId === userId);
      activities.push(...userComments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        type: 'comment' as const,
        author: userId
      })));

      // 3. GitHub 커밋 수집 (owner, repo가 있는 경우만)
      if (owner && repo && githubLogin) {
        try {
          // 기존: const commits = await this.githubService.getAllCommitsForSummaryAI(owner, repo, userId);
          const commits = await this.githubService.getAllMyCommits(owner, repo, userId);
          // 디버깅용 로그 제거
          // const userEmail = (await this.userService.myPage(userId))?.email;
          // 내 커밋만 필터링 관련 로그 제거
          activities.push(
            ...commits.flatMap(commit => {
              let title = commit.commit.message;
              let isMerge = false;
              if (/merge|동기화|sync|squash|revert|pull request/i.test(title)) {
                isMerge = true;
              }
              const messages = title.split(/\n\* |\n/).filter(Boolean);
              return messages
                .map((msg, idx) => ({
                  id: idx === 0 ? commit.sha : `${commit.sha}-${idx}`,
                  title: isMerge ? `[MERGE] ${msg}` : msg,
                  content: msg,
                  createdAt: new Date(commit.commit.author.date),
                  type: 'commit' as const,
                  author: commit.author?.login // 실제 author.login으로 저장
                }))
                .filter(commitObj => includeMergeCommits || !commitObj.title.startsWith('[MERGE]'));
            })
          );
        } catch (error) {
          console.error('GitHub 커밋 수집 실패:', error);
        }

        // 4. GitHub PR 수집 (owner, repo가 있는 경우만)
        try {
          // 기존: const pulls = await this.githubService.getAllPullsForSummaryAI(owner, repo, userId);
          const pulls = await this.githubService.getAllMyPulls(owner, repo, userId);
          // 디버깅 로그 제거
          // console.log('[기여도분석] PR 전체 개수:', pulls.length, '내 githubLogin:', githubLogin);
          const myPRs = pulls.filter(pr => {
            const prLogin = pr.user?.login;
            return prLogin === githubLogin;
          });
          // console.log('[기여도분석] 내 PR 필터링 결과 개수:', myPRs.length);
          activities.push(...myPRs.map(pr => ({
            id: pr.id.toString(),
            title: pr.title,
            content: pr.body,
            createdAt: new Date(pr.created_at),
            updatedAt: new Date(pr.updated_at),
            closedAt: pr.closed_at ? new Date(pr.closed_at) : undefined,
            status: pr.state,
            type: 'pr' as const,
            author: githubLogin
          })));
        } catch (error) {
          console.error('GitHub PR 수집 실패:', error);
        }
      }

    } catch (error) {
      console.error('사용자 활동 데이터 수집 중 오류:', error);
    }

    // 최종 내 활동 커밋 목록 로그
    const myIssues = activities.filter(a => a.type === 'issue');
    const myPRs = activities.filter(a => a.type === 'pr');
    const myCommits = activities.filter(a => a.type === 'commit');
    const myComments = activities.filter(a => a.type === 'comment');
    console.log(`[기여도분석] 내 이슈 개수: ${myIssues.length}, 내 PR 개수: ${myPRs.length}, 내 커밋 개수: ${myCommits.length}, 내 댓글 개수: ${myComments.length}`);
    return activities.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * 프로젝트 전체 타임라인을 수집합니다.
   */
  public async collectProjectTimeline(
    userId: string,
    projectId: string, 
    owner?: string, 
    repo?: string
  ): Promise<ProjectTimeline & { totalCommits?: number; totalPRs?: number }> {
    const events: ActivityData[] = [];

    let totalCommits = 0;
    let totalPRs = 0;

    // owner/repo가 없으면 projectId로 프로젝트 정보에서 추출
    if (!owner || !repo) {
      try {
        const project = await this.projectService.findOne(projectId);
        if (project && project.repository_url) {
          const parsed = parseGithubUrl(project.repository_url);
          if (parsed) {
            owner = parsed.owner;
            repo = parsed.repo;
          }
        }
      } catch (e) {
        console.error('프로젝트 정보에서 owner/repo 추출 실패:', e);
      }
    }

    try {
      // 1. 전체 이슈 수집
      const issues = await this.issuesService.getIssues(projectId);
      // 이슈별 댓글 수, 참여자 수, 라벨, 마감일 등 가공
      const issueIdToComments: Record<string, any[]> = {};
      for (const issue of issues) {
        try {
          const comments = await this.commentService.getComments(projectId, issue.id);
          issueIdToComments[issue.id] = comments;
        } catch (error) {
          issueIdToComments[issue.id] = [];
        }
      }
      events.push(...issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        content: issue.description,
        createdAt: new Date(), // 이슈 엔티티에 createdAt이 없으므로 현재 시간 사용
        updatedAt: new Date(),
        closedAt: undefined,
        status: issue.status,
        type: 'issue' as const,
        author: issue.reporterId || 'unknown',
        commentCount: issueIdToComments[issue.id]?.length ?? 0,
        labels: issue.labels ? issue.labels.map(l => l.name) : [],
        participantCount: new Set([issue.reporterId, ...(issueIdToComments[issue.id]?.map(c => c.authorId) ?? [])]).size,
        dueDate: issue.dueDate ?? undefined,
        priority: undefined // 제거 (엔티티에 없음)
      })));

      // 2. 전체 댓글 수집 - 각 이슈별로 댓글 수집
      const allComments: any[] = [];
      for (const issue of issues) {
        try {
          const comments = issueIdToComments[issue.id] ?? await this.commentService.getComments(projectId, issue.id);
          allComments.push(...comments);
        } catch (error) {
          // 이미 위에서 처리됨
        }
      }
      events.push(...allComments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        type: 'comment' as const,
        author: comment.authorId
      })));

      // 3. 전체 커밋/PR 개수만 별도 집계 (owner, repo가 있는 경우만)
      console.log('[collectProjectTimeline] owner:', owner, 'repo:', repo);
      if (owner && repo) {
        console.log('[collectProjectTimeline] 깃허브 전체 커밋/PR 개수 집계 시작');
        try {
          totalCommits = await this.githubService.getTotalCommitCount(owner, repo, userId);
          console.log('[collectProjectTimeline] totalCommits:', totalCommits);
        } catch (error) {
          console.error('GitHub 전체 커밋 개수 집계 실패:', error);
        }
        try {
          totalPRs = await this.githubService.getTotalPullRequestCount(owner, repo, userId);
          console.log('[collectProjectTimeline] totalPRs:', totalPRs);
        } catch (error) {
          console.error('GitHub 전체 PR 개수 집계 실패:', error);
        }
        // 기존처럼 일부 커밋/PR만 events에 추가 (UI 타임라인 용)
        try {
          const commits = await this.githubService.getCommits(owner, repo, userId);
          events.push(...commits.slice(0, 100).map(commit => ({
            id: commit.sha,
            title: commit.commit.message,
            content: commit.commit.message,
            createdAt: new Date(commit.commit.author.date),
            type: 'commit' as const,
            author: commit.author?.login || commit.committer?.login || 'unknown',
            // 커밋 본문 길이
            contentLength: commit.commit.message?.length ?? 0
          })));
        } catch (error) {
          console.error('GitHub 커밋 수집 실패:', error);
        }
        try {
          const pulls = await this.githubService.getPulls(owner, repo, userId);
          events.push(...pulls.map(pr => ({
            id: pr.id.toString(),
            title: pr.title,
            content: pr.body,
            createdAt: new Date(pr.created_at),
            updatedAt: new Date(pr.updated_at),
            closedAt: pr.closed_at ? new Date(pr.closed_at) : undefined,
            status: pr.state,
            type: 'pr' as const,
            author: pr.user.login
          })));
        } catch (error) {
          console.error('GitHub PR 수집 실패:', error);
        }
      }

    } catch (error) {
      console.error('프로젝트 타임라인 수집 중 오류:', error);
    }

    const sortedEvents = events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return {
      events: sortedEvents,
      summary: this.generateTimelineSummary(sortedEvents),
      totalCommits,
      totalPRs
    };
  }

  /**
   * 기여도 통계를 계산합니다.
   */
  public calculateContributionStats(
    userActivities: ActivityData[], 
    projectTimeline: ProjectTimeline & { totalCommits?: number; totalPRs?: number }
  ): ContributionStats {
    const userIssues = userActivities.filter(a => a.type === 'issue').length;
    const userPRs = userActivities.filter(a => a.type === 'pr').length;
    const userCommits = userActivities.filter(a => a.type === 'commit').length;
    const userComments = userActivities.filter(a => a.type === 'comment').length;

    const totalIssues = projectTimeline.events.filter(a => a.type === 'issue').length;
    const totalPRs = projectTimeline.totalPRs ?? projectTimeline.events.filter(a => a.type === 'pr').length;
    const totalCommits = projectTimeline.totalCommits ?? projectTimeline.events.filter(a => a.type === 'commit').length;
    const totalComments = projectTimeline.events.filter(a => a.type === 'comment').length;

    const totalUserActivities = userIssues + userPRs + userCommits + userComments;
    const totalProjectActivities = totalIssues + totalPRs + totalCommits + totalComments;

    const userContributionPercentage = totalProjectActivities > 0 
      ? Math.min(Math.round((totalUserActivities / totalProjectActivities) * 100), 100)
      : 0;

    return {
      totalIssues,
      totalPRs,
      totalCommits,
      totalComments,
      userIssues,
      userPRs,
      userCommits,
      userComments,
      userContributionPercentage
    };
  }

  /**
   * 협업 스타일을 AI로 분석합니다.
   */
  public async analyzeCollaborationStyle(userActivities: ActivityData[]): Promise<CollaborationFeedback> {
    // 고급 분석 알고리즘 사용
    const metrics = ContributionAnalyzer.calculateMetrics(userActivities);
    const collaborationStyle = ContributionAnalyzer.analyzeCollaborationStyle(metrics);
    const suggestions = ContributionAnalyzer.generateImprovementSuggestions(metrics);
    
    // 강점과 약점 분석
    const strengths = this.analyzeStrengths(metrics);
    const weaknesses = this.analyzeWeaknesses(metrics);
    
    return {
      strengths,
      weaknesses,
      suggestions,
      collaborationStyle,
      activityPattern: this.determineActivityPattern(userActivities)
    };
  }

  /**
   * 강점을 분석합니다.
   */
  private analyzeStrengths(metrics: ContributionMetrics): string[] {
    const strengths: string[] = [];

    // 활동량 관련 강점
    if (metrics.totalActivities > 20) {
      strengths.push('프로젝트에 활발하게 참여하고 있습니다');
    }

    // 지속성 관련 강점
    if (metrics.averageActivitiesPerDay > 2) {
      strengths.push('일평균 활동량이 높습니다');
    }

    // 품질 관련 강점
    if (metrics.qualityMetrics.commitMessageQuality > 70) {
      strengths.push('커밋 메시지 품질이 우수합니다');
    }

    if (metrics.qualityMetrics.issueCompletionRate > 80) {
      strengths.push('이슈 완료율이 높습니다');
    }

    if (metrics.qualityMetrics.prMergeRate > 80) {
      strengths.push('PR 머지율이 높습니다');
    }

    // 협업 관련 강점
    if (metrics.collaborationMetrics.teamInteraction > 60) {
      strengths.push('팀과의 상호작용이 활발합니다');
    }

    if (metrics.collaborationMetrics.commentEngagement > 30) {
      strengths.push('댓글을 통한 소통이 활발합니다');
    }

    return strengths;
  }

  /**
   * 약점을 분석합니다.
   */
  private analyzeWeaknesses(metrics: ContributionMetrics): string[] {
    const weaknesses: string[] = [];

    // 활동량 관련 약점
    if (metrics.totalActivities < 5) {
      weaknesses.push('전체 활동량이 적습니다');
    }

    // 지속성 관련 약점
    if (metrics.averageActivitiesPerDay < 0.5) {
      weaknesses.push('일평균 활동량이 낮습니다');
    }

    // 품질 관련 약점
    if (metrics.qualityMetrics.commitMessageQuality < 50) {
      weaknesses.push('커밋 메시지 품질이 개선이 필요합니다');
    }

    if (metrics.qualityMetrics.issueCompletionRate < 60) {
      weaknesses.push('이슈 완료율이 낮습니다');
    }

    if (metrics.qualityMetrics.prMergeRate < 60) {
      weaknesses.push('PR 머지율이 낮습니다');
    }

    // 협업 관련 약점
    if (metrics.collaborationMetrics.teamInteraction < 40) {
      weaknesses.push('팀과의 상호작용이 부족합니다');
    }

    if (metrics.collaborationMetrics.commentEngagement < 20) {
      weaknesses.push('댓글을 통한 소통이 부족합니다');
    }

    return weaknesses;
  }

  /**
   * 협업 스타일을 결정합니다.
   */
  private determineCollaborationStyle(activities: ActivityData[]): string {
    const issues = activities.filter(a => a.type === 'issue').length;
    const prs = activities.filter(a => a.type === 'pr').length;
    const commits = activities.filter(a => a.type === 'commit').length;
    const comments = activities.filter(a => a.type === 'comment').length;

    if (commits > issues + prs) {
      return '코드 중심형';
    } else if (issues > prs) {
      return '이슈 중심형';
    } else if (comments > (issues + prs) / 2) {
      return '소통 중심형';
    } else {
      return '균형형';
    }
  }

  /**
   * 활동 패턴을 결정합니다.
   */
  private determineActivityPattern(activities: ActivityData[]): string {
    if (activities.length === 0) return '활동 없음';

    const activityDates = activities.map(a => a.createdAt.toDateString());
    const uniqueDates = new Set(activityDates).size;
    const totalDays = activities.length > 0 ? 
      Math.ceil((activities[activities.length - 1].createdAt.getTime() - activities[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    if (uniqueDates / totalDays > 0.8) {
      return '지속적 참여';
    } else if (uniqueDates / totalDays > 0.5) {
      return '규칙적 참여';
    } else {
      return '집중적 참여';
    }
  }

  
  /**
   * Gemini API를 호출하여 프로젝트 요약을 생성합니다.
   */
  private async callGeminiSummaryAI(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_SUMMARYAI_API_KEY;
    if (!apiKey) {
      return 'Gemini API 키가 설정되어 있지 않습니다.';
    }
    console.log('[Gemini 요약 프롬프트]', prompt);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };
    try {
      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '외부 AI 분석 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주세요.';
    } catch (e) {
      console.error('Gemini 요약 API 호출 실패:', e);
      return '요약 생성 중 오류 발생. 다시 한번 시도해주세요.';
    }
  }

  // Gemini Doublecheck API로 프롬프트를 보내는 함수
  private async callGeminiDoublecheck(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_Doublecheck_API_KEY || 'AIzaSyDhyXbVoZ29dKug8pHEoqYFsddhFmf0MFU';
    if (!apiKey) {
      return 'GEMINI_Doublecheck_API_KEY가 설정되어 있지 않습니다.';
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    try {
      const { data } = await axios.post(
        url,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'AI 응답이 없습니다.';
    } catch (e) {
      console.error('Gemini Doublecheck API 호출 실패:', e);
      return '요약 생성 중 오류 발생. 다시 한번 시도해주세요.';
    }
  }

  // 프로젝트 요약을 생성합니다. (1차 요약 후 2차 정제)
  private async generateProjectSummary(timeline: ProjectTimeline): Promise<string> {
    const events = timeline.events;
    if (events.length === 0) return '프로젝트 활동이 없습니다.';

    // 1. 이슈/커밋 주요 내용/키워드 추출 (각 30개로 제한)
    const issues = events.filter(e => e.type === 'issue').slice(0, 30);
    const commits = events.filter(e => e.type === 'commit').slice(0, 30);
    const doneIssues = issues.filter(i => i.status === 'DONE');
    const openIssues = issues.filter(i => i.status !== 'DONE');
    const doneTitles = doneIssues.map(i => i.title).join('\n');
    const openTitles = openIssues.map(i => i.title).join('\n');
    const commitMessages = commits.map(c => c.title).join('\n');

    // 1차 프롬프트
    const prompt = `아래 이슈/커밋 내역만을 바탕으로, 이전 히스토리는 포함하지 말고, 아래와 같은 마크다운 문서 형식으로 프로젝트를 요약해 주세요.\n\n\n## 프로젝트 목적\n(한 문장)\n\n## 주요 기능\n| 기능명 | 설명 |\n|---|---|\n| ... | ... |\n\n## 핵심 기술 스택\n- (React, NestJS, MySQL, AWS, TypeScript, Docker 등 실제 사용한 기술 스택만 나열) ※ 'UI/UX 개선', 'AI 분석', '자동 라벨링' 등 기능/작업/목표는 제외하고, 실제 기술명만 작성해 주세요.\n\n## 최근 집중한 작업\n- (리스트)\n\n## 해결한 과제\n${doneTitles ? doneTitles : '없음'}\n\n## 남은 과제\n${openTitles ? openTitles : '없음'}\n\n[이슈 목록]\n${issues.map(i => i.title).join('\n')}\n\n[커밋 메시지]\n${commitMessages}`;

    // 1차 요약 생성
    const draft = await this.callGeminiDoublecheck(prompt);

    // 2차 검토 프롬프트 (1차 요약만 기반, 마크다운 폼 명확히 안내)
    const markdownForm = `\n\n## 프로젝트 목적\n(한 문장)\n\n## 주요 기능\n| 기능명 | 설명 |\n|---|---|\n| ... | ... |\n\n## 핵심 기술 스택\n- (React, NestJS, MySQL, AWS, TypeScript, Docker 등 실제 사용한 기술 스택만 나열) ※ 'UI/UX 개선', 'AI 분석', '자동 라벨링' 등 기능/작업/목표는 제외하고, 실제 기술명만 작성해 주세요.\n\n## 최근 집중한 작업\n- (리스트)\n\n## 해결한 과제\n- (리스트)\n\n## 남은 과제\n- (리스트)`;
    const reviewPrompt = `아래는 AI가 생성한 프로젝트 요약(초안)입니다.\n\n---\n${draft}\n---\n\n이 초안을 바탕으로, 누락된 핵심 내용이나 표현을 보완하여 반드시 아래의 마크다운 문서 형식(폼)과 동일한 구조로 **최종 프로젝트 요약**을 다시 작성해 주세요.\n\n단, '최근 집중한 작업', '해결한 과제', '남은 과제' 항목은 반드시 위 초안 요약에서 나온 내용을 그대로 복사해서 사용하세요. 안내문이나 메타데이터는 포함하지 말고, 아래 폼을 그대로 따라 결과만 반환해 주세요.${markdownForm}`;

    // 2차 정제 요약 생성
    const reviewed = await this.callGeminiDoublecheck(reviewPrompt);
    return (reviewed ?? '').trim();
  }



  /**
   * 타임라인 기반 요약 프롬프트 빌더
   */
  private buildSummaryPrompt(timeline: ProjectTimeline): string {
    const issues = timeline.events.filter(e => e.type === 'issue').slice(0, 30);
    const commits = timeline.events.filter(e => e.type === 'commit').slice(0, 30);
    const issueTitles = issues.map(i => `- ${i.title}`).join('\n');
    const commitMessages = commits.map(c => `- ${c.title}`).join('\n');

    return `아래 이슈/커밋 내역만을 바탕으로, 이전 히스토리는 포함하지 말고, 다음과 같은 마크다운 문서 형식으로 프로젝트를 요약해 주세요.

    ## 프로젝트 목적
    (한 문장)

    ## 주요 기능
    | 기능명 | 설명 |
    |---|---|
    | ... | ... |

    ## 핵심 기술
    - (기술1)
    - (기술2)

    ## 최근 집중한 작업
    - (리스트)

    ## 해결한 문제
    - (리스트)

    ## 남은 과제
    - (리스트)

    [이슈 목록]
    ${issueTitles}

    [커밋 메시지]
    ${commitMessages}`;
  }

  /**
   * 타임라인 요약을 생성합니다.
   */
  private generateTimelineSummary(events: ActivityData[]): string {
    if (events.length === 0) return '활동이 없습니다.';

    const phases = this.identifyProjectPhases(events);
    return `프로젝트는 ${phases.length}개의 주요 단계로 진행되었습니다: ${phases.join(', ')}`;
  }

  /**
   * 프로젝트 단계를 식별합니다.
   */
  private identifyProjectPhases(events: ActivityData[]): string[] {
    const phases: string[] = [];
    const totalEvents = events.length;

    if (totalEvents === 0) return phases;

    // 초기 단계 (처음 25%)
    const initialEvents = events.slice(0, Math.ceil(totalEvents * 0.25));
    if (initialEvents.length > 0) {
      const initialIssues = initialEvents.filter(e => e.type === 'issue').length;
      if (initialIssues > 0) {
        phases.push('기획 및 이슈 정의');
      }
    }

    // 개발 단계 (25% - 75%)
    const developmentEvents = events.slice(
      Math.ceil(totalEvents * 0.25), 
      Math.ceil(totalEvents * 0.75)
    );
    if (developmentEvents.length > 0) {
      const devCommits = developmentEvents.filter(e => e.type === 'commit').length;
      const devPRs = developmentEvents.filter(e => e.type === 'pr').length;
      if (devCommits > 0 || devPRs > 0) {
        phases.push('개발 및 코드 리뷰');
      }
    }

    // 마무리 단계 (마지막 25%)
    const finalEvents = events.slice(Math.ceil(totalEvents * 0.75));
    if (finalEvents.length > 0) {
      const finalComments = finalEvents.filter(e => e.type === 'comment').length;
      if (finalComments > 0) {
        phases.push('테스트 및 피드백');
      }
    }

    return phases.length > 0 ? phases : ['지속적 개발'];
  }

  /**
   * 내 이슈에 달린 상대방 댓글만 수집해서 Gemini로 피드백 생성
   */
  private async analyzePeerFeedback(userId: string, projectId: string): Promise<string> {
    // 1. 내 이슈 목록 조회
    const myIssues = await this.issuesService.getIssuesCurrentUser(userId, projectId);
    console.log('[내 이슈]', myIssues);
    // 2. 각 이슈의 댓글 중, 내 userId와 다른 author의 댓글만 수집 (최대 30개)
    let peerComments: {content: string, author: string}[] = [];
    for (const issue of myIssues) {
      const comments = await this.commentService.getComments(projectId, issue.id);
      const filtered = comments.filter(c => c.authorId !== userId).map(c => ({content: c.content, author: c.authorId}));
      if (filtered.length > 0) {
        console.log(`[이슈 ${issue.id}] 팀원 댓글`, filtered);
      }
      peerComments.push(...filtered);
    }
    console.log('[최종 팀원 피드백 후보]', peerComments);
    peerComments = peerComments.slice(0, 30);
    if (peerComments.length === 0) {
      console.log('[팀원 피드백 없음]');
      return '팀원 피드백이 없습니다.';
    }

    // 3. 프롬프트 생성 (강점/개선점 중심)
    // 기존: 번호와 내용
    // const prompt = `아래는 내가 생성한 이슈에 대해 팀원들이 남긴 댓글입니다.\n\n${peerComments.map((c, i) => `${i+1}. ${c.content}`).join('\n')}\n\n이 댓글들을 바탕으로, 내 협업 스타일과 커뮤니케이션 특징을 간단히 요약하고, 특히 \"강점\"과 \"개선점\"을 구체적으로 마크다운 리스트로 정리해 주세요. 아래와 같은 마크다운 구조로 작성해 주세요.\n\n## 팀원 피드백 요약\n\n### 강점\n- (구체적인 강점)\n\n### 개선점\n- (구체적인 개선점)\n\n### 한줄 총평\n- (한 문장으로 내 협업/커뮤니케이션 스타일을 요약)`;

    // 수정: 번호 없이 작성자와 내용, 또는 내용만 나열
    const peerCommentLines = peerComments.map(c => c.author ? `- (${c.author}) ${c.content}` : `- ${c.content}`).join('\n');
    const prompt = `아래는 내가 생성한 이슈에 대해 팀원들이 남긴 댓글입니다.
    ${peerCommentLines}
    이 댓글들을 바탕으로, 내 협업 스타일과 커뮤니케이션 특징을 간단히 요약하고, 특히 "강점"과 "개선점"을 구체적으로 마크다운 리스트로 정리해 주세요. 아래와 같은 마크다운 구조로 작성해 주세요.
    댓글 내용만을 기반으로, 메타데이터나 식별자(예: “-(240b9327-9cf6-445d-8852-36e147ef4494)”) 없이 순수한 댓글 텍스트만을 활용해 다음을 수행해 주세요.
    ## 팀원 피드백 요약
    ### 강점
    - (구체적인 강점)
    ### 개선점
    - (구체적인 개선점)
    ### 한줄 총평
    - (한 문장으로 내 협업/커뮤니케이션 스타일을 요약)`;

    // 4. Gemini API 호출 (GEMINI_FEEDBACK_API_KEY 사용)
    return await this.callGeminiFeedbackAI(prompt);
  }

  /**
   * Gemini API를 호출하여 팀원 피드백 요약을 생성합니다.
   */
  private async callGeminiFeedbackAI(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_FEEDBACK_API_KEY;
    if (!apiKey) {
      return 'Gemini 피드백 API 키가 설정되어 있지 않습니다.';
    }
    console.log('[Gemini 피드백 프롬프트]', prompt);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };
    try {
      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '외부 AI 분석 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주세요.';
    } catch (e) {
      console.error('Gemini 피드백 API 호출 실패:', e);
      return '피드백 요약 생성 중 오류 발생. 다시 한번 시도해주세요.';
    }
  }
} 
