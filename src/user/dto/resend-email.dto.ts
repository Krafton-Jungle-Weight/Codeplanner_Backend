import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
