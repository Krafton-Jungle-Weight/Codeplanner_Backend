import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetProjectOverviewDto {
  @ApiProperty({
    description: '프로젝트 ID',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}

export class ProjectOverviewResponseDto {
  @ApiProperty({
    description: '프로젝트 제목',
    example: '웹 개발 프로젝트'
  })
  title: string;

  @ApiProperty({
    description: '프로젝트 설명',
    example: '사용자 인증 시스템 개발'
  })
  description: string;

  @ApiProperty({
    description: '프로젝트 키',
    example: 'PROJ-550E8400'
  })
  projectKey: string;

  @ApiProperty({
    description: '프로젝트 상태',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'COMPLETED', 'OVERDUE']
  })
  status: string;

  @ApiProperty({
    description: '저장소 URL',
    example: 'https://github.com/user/project',
    nullable: true
  })
  repositoryUrl: string | null;

  @ApiProperty({
    description: '마감일',
    example: '2024-12-31',
    nullable: true
  })
  dueDate: string | null;

  @ApiProperty({
    description: '프로젝트 라벨들',
    example: ['bug', 'feature', 'enhancement']
  })
  labels: string[];
} 