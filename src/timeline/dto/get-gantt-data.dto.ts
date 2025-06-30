import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetGanttDataDto {
  @ApiProperty({
    description: '프로젝트 ID',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}

export class GanttDataResponseDto {
  @ApiProperty({
    description: '작업 ID',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  id: string;

  @ApiProperty({
    description: '작업 제목',
    example: '로그인 기능 구현'
  })
  name: string;

  @ApiProperty({
    description: '시작일',
    example: '2024-01-01',
    nullable: true
  })
  start: string | null;

  @ApiProperty({
    description: '종료일',
    example: '2024-01-15',
    nullable: true
  })
  end: string | null;

  @ApiProperty({
    description: '진행률 (0-100)',
    example: 75
  })
  progress: number;
} 