import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetProjectStatisticsDto {
  @ApiProperty({
    description: '프로젝트 ID',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}

export class ProjectStatisticsResponseDto {
  @ApiProperty({
    description: '상태 라벨',
    example: '대기 중'
  })
  label: string;

  @ApiProperty({
    description: '상태 색상',
    example: '#fbbf24'
  })
  color: string;

  @ApiProperty({
    description: '해당 상태의 작업 수',
    example: 3
  })
  count: number;
} 