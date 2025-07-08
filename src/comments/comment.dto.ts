// 댓글 생성용 DTO
export class CreateCommentDto {
  issueId: string;
  authorId: string;
  content: string;
}

// 댓글 응답용 DTO
export class CommentResponseDto {
  id: string;
  issueId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateCommentDto {
  content: string;
  updatedAt: Date;
}