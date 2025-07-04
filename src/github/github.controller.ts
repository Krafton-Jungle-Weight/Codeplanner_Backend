import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { GithubService } from "./github.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { User } from "src/user/user.entity";
import { CurrentUser } from "src/auth/user.decorator";


@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @UseGuards(JwtAuthGuard)
  @Get('connect/:repoUrl')
  async connectWebhook(@Param('repoUrl') repoUrl: string, @CurrentUser() user: User) {
    const decodedRepoUrl = decodeURIComponent(repoUrl);
    return this.githubService.connect(decodedRepoUrl, user);
  }


  @Post('webhook')
  async webhook(@Body() body: any) {
    console.log('webhook', body);

    
  }
}