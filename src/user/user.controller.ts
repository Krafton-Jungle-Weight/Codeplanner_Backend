import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyEmailDto } from 'src/email/dto/verify-email.dto';

@Controller('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/create')
  async createUser(@Body() input: CreateUserDto): Promise<void> {
    await this.userService.createUser(input);
  }

  @Get('/email-verify')
  async verifyEmail(
    @Query('email') email: string,
    @Query('verifyToken') verifyToken: string,
  ) {
    return await this.userService.verifyEmail(email, verifyToken);
  }
}
