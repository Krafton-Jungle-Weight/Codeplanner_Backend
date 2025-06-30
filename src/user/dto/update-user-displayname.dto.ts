import { IsNotEmpty } from 'class-validator';

export class UpdateUserDisplayNameDto {
  @IsNotEmpty()
  display_name: string;
}
