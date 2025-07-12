import { IsString, IsUUID } from 'class-validator';

export class CreateLabelDto {
  @IsUUID()
  projectId: string;

  @IsString()
  name: string;

  @IsString()
  color: string;
}

