import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDateColumn, Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto, UpdateCommentDto } from './comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { IssuesService } from 'src/issues/issues.service';
import { ProjectService } from 'src/project/project.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
    @Inject(IssuesService)
    private readonly issuesService: IssuesService,
    @Inject(ProjectService)
    private readonly projectService: ProjectService,
  ) {}

  async createComment(
    projectId: string,
    issueId: string,
    dto: CreateCommentDto,
    user: User,
  ) {
    // @[display_name](id) 형식에서 id만 추출
    const mentionIds: string[] = [];
    const mentionRegex = /@\[[^\]]+\]\(([^)]+)\)/g;
    let match;
    while ((match = mentionRegex.exec(dto.content)) !== null) {
      mentionIds.push(match[1]);
    }
    console.log('mention ids: ', mentionIds);

    // 멘션 알림 생성
    if (mentionIds.length !== 0) {
      // 이슈 제목, 프로젝트 이름 조회 (비동기)
      const issue = await this.issuesService.findIssueById(issueId, projectId);
      const issueTitle = issue.title;
      const projectName = await this.projectService.getProjectName(projectId);
      // 각 멘션 대상에게 알림 생성
      for (const mentionId of mentionIds) {
        await this.notificationService.createNotification(
          mentionId,
          'issue_created_mention',
          {
            issueId: issueId,
            issueTitle: issueTitle,
            projectName: projectName,
            projectId: projectId,
          },
        );
      }
      
    }

    // 추출된 mentionIds를 활용하려면 아래에서 사용
    const comment = this.commentRepository.create({
      ...dto,
      issue: { id: issueId },
      author: { id: user.id },
    });

    return this.commentRepository.save(comment);
  }

  async getCommentsSortByDate(projectId: string, issueId: string) {
    const comments = await this.commentRepository.find({
      where: { issue: { id: issueId } },
      relations: ['author'],
      order: {createdAt: 'DESC'},
    });

    // display_name을 포함한 결과로 변환
    return comments.map((comment) => ({
      id: comment.id,
      issueId: comment.issueId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      displayName: comment.author?.display_name,
    }));
  }

  async getComments(projectId: string, issueId: string) {
    const comments = await this.commentRepository.find({
      where: { issue: { id: issueId } },
      relations: ['author'],
    });
    // display_name을 포함한 결과로 변환
    return comments.map((comment) => ({
      id: comment.id,
      issueId: comment.issueId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      displayName: comment.author?.display_name,
    }));
  }

  async deleteComment(
    projectId: string,
    issueId: string,
    commentId: string,
    user: User,
  ) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, issue: { id: issueId }, author: { id: user.id } },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return this.commentRepository.remove(comment);
  }

  async updateComment(
    projectId: string,
    issueId: string,
    commentId: string,
    dto: UpdateCommentDto,
    user: User,
  ) {
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
