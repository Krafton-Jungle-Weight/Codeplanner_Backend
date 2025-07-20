export class ContributionAnalysisRequestDto {
  projectId: string;
  userId: string;
  owner?: string;  // 선택적
  repo?: string;   // 선택적
}

export class ActivityData {
  id: string;
  title?: string;
  content?: string;
  createdAt: Date;
  updatedAt?: Date;
  closedAt?: Date;
  status?: string;
  type: 'issue' | 'pr' | 'commit' | 'comment';
  author: string;
  // 대표 이슈/커밋 선정을 위한 확장 필드 (optional)
  commentCount?: number;
  labels?: string[];
  participantCount?: number;
  priority?: string;
  dueDate?: Date;
}

export class ContributionStats {
  totalIssues: number;
  totalPRs: number;
  totalCommits: number;
  totalComments: number;
  userIssues: number;
  userPRs: number;
  userCommits: number;
  userComments: number;
  userContributionPercentage: number;
}

export class CollaborationFeedback {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  collaborationStyle: string;
  activityPattern: string;
}

export class ProjectTimeline {
  events: ActivityData[];
  summary: string;
}

export class ContributionAnalysisResponseDto {
  projectTimeline: ProjectTimeline;
  userStats: ContributionStats;
  userActivities: ActivityData[];
  collaborationFeedback: CollaborationFeedback;
  aiSummary: string;
  peerFeedbackSummary: string; // 팀원 피드백 요약
} 