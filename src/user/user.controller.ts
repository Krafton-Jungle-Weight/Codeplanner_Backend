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
import { UpdateUserDisplayNameDto } from './dto/update-user-displayname.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 회원가입
  @Post('/create')
  async createUser(@Body() input: CreateUserDto): Promise<void> {
    await this.userService.createUser(input);
  }

  // 이메일 인증
  @Get('/email-verify')
  async verifyEmail(
    @Query('email') email: string,
    @Query('verifyToken') verifyToken: string,
  ) {
    return await this.userService.verifyEmail(email, verifyToken);
  }

  // 이메일 재전송
  @UseGuards(JwtAuthGuard)
  @Post('/email-resend')
  async resendEmail(@CurrentUser() user: any) {
    this.userService.resendJoinEmail(user.email);
    return { message: '이메일 재전송 완료' };
  }

  // 마이페이지
  @Get('/mypage')
  @UseGuards(JwtAuthGuard)
  async myPage(@CurrentUser() user: any) {
    // 사용자 정보 한번 확인
    console.log('Current User from JWT:', user);
    return await this.userService.myPage(user.id);
  }

  // 닉네임 변경
  @Post('/mypage/updateDisplayName')
  @UseGuards(JwtAuthGuard)
  async updateDisplayName(
    @CurrentUser() user: any,
    @Body() input: UpdateUserDisplayNameDto,
  ) {
    return await this.userService.updateDisplayName(
      user.id,
      input.display_name,
    );
  }

  // 이메일 인증 여부 확인
  @Get('/mypage/isVerified')
  @UseGuards(JwtAuthGuard)
  async isVerified(@CurrentUser() user: any) {
    return await this.userService.isVerified(user.id);
  }
}
