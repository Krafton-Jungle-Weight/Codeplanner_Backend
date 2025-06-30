import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetProjectSummaryDto {
  @ApiProperty({
    description: '프로젝트 ID',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}

export class ProjectSummaryResponseDto {
  @ApiProperty({
    description: '전체 작업 수',
    example: 10
  })
  totalTasks: number;

  @ApiProperty({
    description: '진행률 (0-100)',
    example: 75
  })
  progress: number;

  @ApiProperty({
    description: '프로젝트 마감일',
    example: '2024-12-31',
    nullable: true
  })
  dueDate: string | null;

  @ApiProperty({
    description: '팀원 수',
    example: 5
  })
  teamMembers: number;

  @ApiProperty({
    description: '프로젝트 제목',
    example: '웹 개발 프로젝트'
  })
  projectTitle: string;
} 