export class UpdateIssueDto {
  title?: string;
  description?: string;
  issueType?: string;
  status?: string;
  assigneeId?: string | null;
  reporterId?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  tag?: string | null;
  labels?: Array<{ id: string; name: string; color: string }>;
}