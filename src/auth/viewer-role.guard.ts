import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectService } from '../project/project.service';

@Injectable()
export class ViewerRoleGuard implements CanActivate {
  constructor(private projectService: ProjectService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const projectId = request.params.projectId || request.params.id;

    if (!user || !projectId) {
      return true; // 기본 인증은 JwtAuthGuard에서 처리
    }

    // GET 요청은 모든 역할에서 허용
    if (request.method === 'GET') {
      return true;
    }

    // 프로젝트 멤버 역할 확인
    try {
      const userRole = await this.projectService.getUserRole(projectId, user.id);
      
      // VIEWER 역할은 GET 요청만 가능
      if (userRole.role === 'VIEWER') {
        throw new ForbiddenException('뷰어 권한으로는 조회만 가능합니다.');
      }
      
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // 역할 조회 실패 시 기본적으로 허용 (다른 가드에서 처리)
      return true;
    }
  }
} 