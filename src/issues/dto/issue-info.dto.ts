export class UpdateIssueDto {
  title?: string;
  description?: string;
  issueType?: string;
  status?: string;
  assigneeId?: string | null;
  reporterId?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
}