import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { CreateCommentDto, UpdateCommentDto } from "./comment.dto";
import { CommentService } from "./comment.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CurrentUser } from "src/auth/user.decorator";
import { User } from "src/user/user.entity";

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) { }
  
  @UseGuards(JwtAuthGuard)
  @Post('/:projectId/:issueId/')
  async createComment(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentService.createComment(projectId, issueId, dto, user);
  } 

  @Get('/:projectId/:issueId/')
  async getComments(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
  ) {
    return this.commentService.getComments(projectId, issueId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:projectId/:issueId/:commentId')
  async deleteComment(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: User,
  ) {
    return this.commentService.deleteComment(projectId, issueId, commentId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:projectId/:issueId/:commentId')
  async updateComment(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentService.updateComment(projectId, issueId, commentId, dto, user);
  }
}



