import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResendEmailDto } from './dto/resend-email.dto';
import { VerifyEmailDto } from 'src/email/dto/verify-email.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/user.decorator';

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

  @Post('/email-resend')
  async resendEmail(@Body() input: ResendEmailDto) {
    return await this.userService.resendJoinEmail(input.email);
  }

  @Get('/mypage')
  @UseGuards(JwtAuthGuard)
  async myPage(@CurrentUser() user: any) {
    // 사용자 정보 한번 확인
    console.log('Current User from JWT:', user);
    return await this.userService.myPage(user.id);
  }

  @Get('/mypage/update')
  async updageMyPage(@CurrentUser() user: any) {
    return await this.userService.updateMyPage(user.id);
  }
}
