import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Comment } from "./comment.entity";
import { CreateCommentDto } from "./comment.dto";
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
}

