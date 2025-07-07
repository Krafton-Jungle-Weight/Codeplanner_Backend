import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CreateCommentDto } from "./comment.dto";
import { CommentService } from "./comment.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CurrentUser } from "src/auth/user.decorator";
import { User } from "src/user/user.entity";

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) { }
  
  @UseGuards(JwtAuthGuard)
  @Post('/:projectId/:issueId/comments')
  async createComment(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentService.createComment(projectId, issueId, dto, user);
  } 

  @Get('/:projectId/:issueId/comments')
  async getComments(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
  ) {
    return this.commentService.getComments(projectId, issueId);
  }
}



