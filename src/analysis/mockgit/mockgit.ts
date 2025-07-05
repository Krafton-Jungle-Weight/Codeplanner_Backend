import { Injectable } from '@nestjs/common';
import { AnalyzeRequest } from '../dto/analyze-request.dto';

@Injectable()
export class GitService {
  // 커밋 해시로 파일 데이터 변환: 아마 이곳에는 commit으로
  // json을 받아오면 될 듯 함.
  // json에서 파일 명, 내부 내용, 언어만 받아오면 될 듯
  getCommitFiles(commitHash: string): AnalyzeRequest[] {
    console.log("input message: ", commitHash);
    // C언어 파일만 반환 (목데이터)
    if (commitHash === 'abc123') {
      return [
        {
          filename: 'main.c',
          content: '#include <stdio.h>\nint main() { printf("Hello, world!\\n"); return 0; }',
          language: 'c',
        },
        {
          filename: 'util.c',
          content: 'void foo() { /* ... */ }',
          language: 'c',
        },
      ];
    }
    // 기본값
    return [
      {
        filename: 'default.c',
        content: 'int main() { return 0; }',
        language: 'c',
      },
    ];
  }
}