import { ActivityData } from '../dto/contribution-analysis.dto';

export interface ContributionMetrics {
  // 기본 통계
  totalActivities: number;
  uniqueDays: number;
  averageActivitiesPerDay: number;
  
  // 활동 유형별 분석
  activityTypeDistribution: Record<string, number>;
  
  // 시간 패턴 분석
  timePattern: {
    morning: number;    // 6-12시
    afternoon: number;  // 12-18시
    evening: number;    // 18-24시
    night: number;      // 0-6시
  };
  
  // 주간 패턴 분석
  weeklyPattern: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  
  // 품질 지표
  qualityMetrics: {
    commitMessageQuality: number;  // 커밋 메시지 길이 및 명확성
    issueCompletionRate: number;   // 완료된 이슈 비율
    prMergeRate: number;          // 머지된 PR 비율
    responseTime: number;          // 평균 응답 시간 (시간)
  };
  
  // 협업 지표
  collaborationMetrics: {
    commentEngagement: number;     // 댓글 참여도
    crossIssueParticipation: number; // 다른 이슈 참여도
    teamInteraction: number;       // 팀원과의 상호작용
  };
}

export class ContributionAnalyzer {
  /**
   * 활동 데이터로부터 고급 메트릭을 계산합니다.
   */
  static calculateMetrics(activities: ActivityData[]): ContributionMetrics {
    if (activities.length === 0) {
      return this.getEmptyMetrics();
    }

    const sortedActivities = activities.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return {
      totalActivities: activities.length,
      uniqueDays: this.calculateUniqueDays(activities),
      averageActivitiesPerDay: this.calculateAverageActivitiesPerDay(activities),
      activityTypeDistribution: this.calculateActivityTypeDistribution(activities),
      timePattern: this.calculateTimePattern(activities),
      weeklyPattern: this.calculateWeeklyPattern(activities),
      qualityMetrics: this.calculateQualityMetrics(activities),
      collaborationMetrics: this.calculateCollaborationMetrics(activities)
    };
  }

  /**
   * 활동 유형별 분포를 계산합니다.
   */
  private static calculateActivityTypeDistribution(activities: ActivityData[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    const total = activities.length;

    activities.forEach(activity => {
      const type = activity.type;
      distribution[type] = (distribution[type] || 0) + 1;
    });

    // 백분율로 변환
    Object.keys(distribution).forEach(type => {
      distribution[type] = Math.round((distribution[type] / total) * 100);
    });

    return distribution;
  }

  /**
   * 시간대별 패턴을 계산합니다.
   */
  private static calculateTimePattern(activities: ActivityData[]): ContributionMetrics['timePattern'] {
    const timePattern = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    activities.forEach(activity => {
      const hour = new Date(activity.createdAt).getHours();
      
      if (hour >= 6 && hour < 12) timePattern.morning++;
      else if (hour >= 12 && hour < 18) timePattern.afternoon++;
      else if (hour >= 18 && hour < 24) timePattern.evening++;
      else timePattern.night++;
    });

    return timePattern;
  }

  /**
   * 요일별 패턴을 계산합니다.
   */
  private static calculateWeeklyPattern(activities: ActivityData[]): ContributionMetrics['weeklyPattern'] {
    const weeklyPattern = {
      monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
      friday: 0, saturday: 0, sunday: 0
    };

    activities.forEach(activity => {
      const day = new Date(activity.createdAt).getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      weeklyPattern[dayNames[day] as keyof typeof weeklyPattern]++;
    });

    return weeklyPattern;
  }

  /**
   * 품질 메트릭을 계산합니다.
   */
  private static calculateQualityMetrics(activities: ActivityData[]): ContributionMetrics['qualityMetrics'] {
    const commits = activities.filter(a => a.type === 'commit');
    const issues = activities.filter(a => a.type === 'issue');
    const prs = activities.filter(a => a.type === 'pr');

    // 커밋 메시지 품질 (길이와 명확성)
    const commitMessageQuality = commits.length > 0 
      ? commits.reduce((sum, commit) => {
          const message = commit.title || '';
          const length = message.length;
          const hasConventionalFormat = /^(feat|fix|docs|style|refactor|test|chore):/.test(message);
          return sum + (length > 10 ? 1 : 0) + (hasConventionalFormat ? 1 : 0);
        }, 0) / commits.length * 50
      : 0;

    // 이슈 완료율 (closedAt이 있는 이슈 비율)
    const completedIssues = issues.filter(issue => issue.closedAt).length;
    const issueCompletionRate = issues.length > 0 
      ? (completedIssues / issues.length) * 100 
      : 0;

    // PR 머지율 (merged 상태인 PR 비율)
    const mergedPRs = prs.filter(pr => pr.status === 'closed').length;
    const prMergeRate = prs.length > 0 
      ? (mergedPRs / prs.length) * 100 
      : 0;

    // 평균 응답 시간 (이슈 생성 후 첫 댓글까지의 시간)
    const responseTimes: number[] = [];
    issues.forEach(issue => {
      const issueTime = new Date(issue.createdAt).getTime();
      const comments = activities.filter(a => 
        a.type === 'comment' && 
        new Date(a.createdAt).getTime() > issueTime
      );
      
      if (comments.length > 0) {
        const firstCommentTime = new Date(comments[0].createdAt).getTime();
        const responseTime = (firstCommentTime - issueTime) / (1000 * 60 * 60); // 시간 단위
        responseTimes.push(responseTime);
      }
    });

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    return {
      commitMessageQuality: Math.round(commitMessageQuality),
      issueCompletionRate: Math.round(issueCompletionRate),
      prMergeRate: Math.round(prMergeRate),
      responseTime: Math.round(averageResponseTime)
    };
  }

  /**
   * 협업 메트릭을 계산합니다.
   */
  private static calculateCollaborationMetrics(activities: ActivityData[]): ContributionMetrics['collaborationMetrics'] {
    const comments = activities.filter(a => a.type === 'comment');
    const issues = activities.filter(a => a.type === 'issue');
    
    // 댓글 참여도 (댓글 수 / 전체 활동 수)
    const commentEngagement = activities.length > 0 
      ? (comments.length / activities.length) * 100 
      : 0;

    // 다른 이슈 참여도 (다른 사람이 생성한 이슈에 댓글을 단 비율)
    const userIssueIds = new Set(issues.map(i => i.id));
    const commentsOnOthersIssues = comments.filter(comment => {
      // 실제로는 이슈 ID를 추출해야 하지만, 여기서는 간단히 계산
      return true; // 실제 구현에서는 이슈 ID 매핑 필요
    }).length;
    
    const crossIssueParticipation = comments.length > 0 
      ? (commentsOnOthersIssues / comments.length) * 100 
      : 0;

    // 팀 상호작용 (다양한 사용자와의 상호작용)
    const uniqueAuthors = new Set(activities.map(a => a.author)).size;
    const teamInteraction = uniqueAuthors > 1 ? Math.min(uniqueAuthors * 20, 100) : 0;

    return {
      commentEngagement: Math.round(commentEngagement),
      crossIssueParticipation: Math.round(crossIssueParticipation),
      teamInteraction: Math.round(teamInteraction)
    };
  }

  /**
   * 고유한 활동 일수를 계산합니다.
   */
  private static calculateUniqueDays(activities: ActivityData[]): number {
    const uniqueDates = new Set(
      activities.map(activity => 
        new Date(activity.createdAt).toDateString()
      )
    );
    return uniqueDates.size;
  }

  /**
   * 일평균 활동 수를 계산합니다.
   */
  private static calculateAverageActivitiesPerDay(activities: ActivityData[]): number {
    const uniqueDays = this.calculateUniqueDays(activities);
    return uniqueDays > 0 ? Math.round(activities.length / uniqueDays * 10) / 10 : 0;
  }

  /**
   * 빈 메트릭을 반환합니다.
   */
  private static getEmptyMetrics(): ContributionMetrics {
    return {
      totalActivities: 0,
      uniqueDays: 0,
      averageActivitiesPerDay: 0,
      activityTypeDistribution: {},
      timePattern: { morning: 0, afternoon: 0, evening: 0, night: 0 },
      weeklyPattern: {
        monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
        friday: 0, saturday: 0, sunday: 0
      },
      qualityMetrics: {
        commitMessageQuality: 0,
        issueCompletionRate: 0,
        prMergeRate: 0,
        responseTime: 0
      },
      collaborationMetrics: {
        commentEngagement: 0,
        crossIssueParticipation: 0,
        teamInteraction: 0
      }
    };
  }

  /**
   * 활동 패턴을 분석하여 협업 스타일을 결정합니다.
   */
  static analyzeCollaborationStyle(metrics: ContributionMetrics): string {
    const { activityTypeDistribution, qualityMetrics, collaborationMetrics } = metrics;

    // 코드 중심형: 커밋이 많고 품질이 높음
    if (activityTypeDistribution.commit > 40 && qualityMetrics.commitMessageQuality > 70) {
      return '코드 중심형';
    }

    // 이슈 중심형: 이슈가 많고 완료율이 높음
    if (activityTypeDistribution.issue > 30 && qualityMetrics.issueCompletionRate > 80) {
      return '이슈 중심형';
    }

    // 소통 중심형: 댓글이 많고 팀 상호작용이 높음
    if (activityTypeDistribution.comment > 40 && collaborationMetrics.teamInteraction > 60) {
      return '소통 중심형';
    }

    // 균형형: 모든 영역에서 적절한 활동
    if (Object.values(activityTypeDistribution).every(rate => rate > 10 && rate < 50)) {
      return '균형형';
    }

    return '개별형';
  }

  /**
   * 활동 패턴을 분석하여 개선 제안을 생성합니다.
   */
  static generateImprovementSuggestions(metrics: ContributionMetrics): string[] {
    const suggestions: string[] = [];

    // 커밋 메시지 품질이 낮은 경우
    if (metrics.qualityMetrics.commitMessageQuality < 50) {
      suggestions.push('커밋 메시지를 더 명확하고 구체적으로 작성해보세요');
    }

    // 이슈 완료율이 낮은 경우
    if (metrics.qualityMetrics.issueCompletionRate < 60) {
      suggestions.push('생성한 이슈를 완료까지 추적하는 습관을 기르세요');
    }

    // 팀 상호작용이 낮은 경우
    if (metrics.collaborationMetrics.teamInteraction < 40) {
      suggestions.push('팀원들과의 상호작용을 늘려보세요');
    }

    // 특정 시간대에 집중된 경우
    const timePattern = metrics.timePattern;
    const maxTime = Math.max(timePattern.morning, timePattern.afternoon, timePattern.evening, timePattern.night);
    if (maxTime > 60) {
      suggestions.push('활동 시간을 더 균등하게 분산해보세요');
    }

    return suggestions;
  }
} 