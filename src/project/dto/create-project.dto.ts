import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  repository_url?: string;

  @IsDateString()
  @IsOptional()
  due_date?: string;

  @IsUUID()
  @IsOptional()
  leader_id?: string;

  @IsString()
  @IsOptional()
  project_leader?: string;

  @IsString()
  @IsOptional()
  tag?: string;
} 