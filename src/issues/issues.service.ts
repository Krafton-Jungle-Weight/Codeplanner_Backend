import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Issue } from './issues.entity';
import { Repository } from 'typeorm';
import { CreateIssueDto } from './issues-update.dto';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private issueRepository: Repository<Issue>,
  ) {}

  // UUID 값을 정리하는 헬퍼 함수
  private cleanUuid(uuid: string | undefined): string | undefined {
    if (!uuid) return undefined;

    // UUID 패턴 매칭 (8-4-4-4-12 형식)
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 이미 올바른 UUID 형식이면 그대로 반환
    if (uuidPattern.test(uuid)) {
      return uuid;
    }

    // UUID 패턴을 찾아서 추출
    const match = uuid.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
    if (match) {
      return match[0];
    }

    // UUID가 아닌 경우 undefined 반환
    return undefined;
  }

  async getIssues(projectId: string) {
    return this.issueRepository.find({
      where: { projectId },
    });
  }

  async updateIssueOrderAndStatus(
    issueIds: string[],
    targetColumnId: string,
  ): Promise<void> {
    const sql = `
      UPDATE issue AS i
      SET
        status = $2,
        position  = u.ord
      FROM unnest($1::uuid[]) WITH ORDINALITY AS u(id, ord)
      WHERE i.id = u.id;
    `;
    await this.issueRepository.query(sql, [issueIds, targetColumnId]);
  }

  async createIssue(projectId: string, dto: CreateIssueDto): Promise<void> {
    // UUID 값들을 정리
    const cleanAssigneeId = this.cleanUuid(dto.assigneeId);
    const cleanReporterId = this.cleanUuid(dto.reporterId);

    const sql = `
      INSERT INTO issue (project_id, title, description, issue_type, status, assignee_id, reporter_id, start_date, due_date, position)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    await this.issueRepository.query(sql, [
      projectId,
      dto.title,
      dto.description,
      dto.issueType,
      dto.status,
      cleanAssigneeId,
      cleanReporterId,
      dto.startDate,
      dto.dueDate,
      dto.position,
    ]);
  }
}
