import { Injectable } from '@nestjs/common';
import { AnalyzeRequest } from '../dto/analyze-request.dto';

@Injectable()
export class GitCommit {
  getCommitFiles(commitHash: string): AnalyzeRequest[] {
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