import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyResetTokenDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
