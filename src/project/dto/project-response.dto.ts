export class ProjectResponseDto {
  id: string;
  title: string;
  descrition?: string;
  project_key: string;
  status: string;
  repository_url?: string;
  due_date?: string;
  expires_at?: string;
  project_people: number;
  project_leader: string;
  leader_id: string;
} 