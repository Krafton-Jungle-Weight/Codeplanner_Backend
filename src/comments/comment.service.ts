import { Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { Comment } from "./comment.entity";
import { CreateCommentDto, UpdateCommentDto } from "./comment.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}



  async createComment(projectId: string, issueId: string, dto: CreateCommentDto, user: User) {
    const comment = this.commentRepository.create({
      ...dto,
      issue: { id: issueId },
      author: { id: user.id },
    });
    return this.commentRepository.save(comment);
  }

  async getComments(projectId: string, issueId: string) {
    return this.commentRepository.find({
      where: { issue: { id: issueId } },
    });
  }

  async deleteComment(projectId: string, issueId: string, commentId: string, user: User) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, issue: { id: issueId }, author: { id: user.id } },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return this.commentRepository.remove(comment);
  }

  async updateComment(projectId: string, issueId: string, commentId: string, dto: UpdateCommentDto, user: User) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, issue: { id: issueId }, author: { id: user.id } },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (dto.content) {
      comment.content = dto.content;
    }
    if (dto.updatedAt) {
      comment.updatedAt = dto.updatedAt;
    }
    return this.commentRepository.save(comment);
  }
}

