import { Type } from 'class-transformer';
import { IsString, IsOptional, IsDateString, IsUUID, IsEnum, IsInt, Min, Max } from 'class-validator';

export enum CodeStyle {
  LLVM = 'llvm',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  CHROMIUM = 'chromium',
}
export class ClangFormatDto{
  @IsEnum(CodeStyle, {
    message: '스타일은 llvm, google, microsoft, chrominum중 한개여야함',
  })
  style: CodeStyle;

  @Type(() => Number)
  @IsInt({ message: 'indent는 정수여야 해요!' })
  @Min(2)
  @Max(16)
  indent: number
  
} 