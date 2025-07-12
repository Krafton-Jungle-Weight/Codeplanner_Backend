import {
  IsUUID,
  ArrayNotEmpty,
  ArrayUnique,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
  IsBoolean,
  IsHexColor,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Label } from './label.entity';

export class ReorderIssuesDto {
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  issueIds: string[];

  @IsUUID('4')
  targetColumnId: string;
}

export class CreateIssueDto {
  @IsUUID('4')
  projectId: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MaxLength(20)
  issueType: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @IsUUID('4')
  assigneeId?: string;

  @IsUUID('4')
  reporterId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Label)
  labels?: Label[];

  @IsOptional()
  @IsBoolean()
  createBranch?: boolean;
}

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  issueType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @IsUUID('4')
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;
}
