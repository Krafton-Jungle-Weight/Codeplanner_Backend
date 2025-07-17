import { IsUUID, IsArray, ArrayNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AssignReviewersDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  reviewerIds: string[];
}

export class ReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class RejectReviewDto extends ReviewDto {
  @IsString()
  @MaxLength(1000)
  reason: string;
} 