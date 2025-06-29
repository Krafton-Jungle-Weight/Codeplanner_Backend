export class IssueInfoDto {
  id: string;
  projectId: string;
  title: string;
  description: string;
  issueType: string;
  status: string;
  assigneeId: string | null;
  reporterId: string | null;
  startDate: Date | null;
  dueDate: Date | null;
}