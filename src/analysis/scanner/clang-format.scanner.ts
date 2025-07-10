import { execa } from 'execa';
import { BaseScanner, ScannerConfig, ScannerResult } from './base.scanner';
import { promises as fs } from 'fs';

export class ClangFormatScanner extends BaseScanner {
  constructor(config: ScannerConfig) {
    super(config);
  }

  async execute(): Promise<ScannerResult> {
    try {
      // 1. 포맷 검사: --dry-run --Werror (exitCode 0: 포맷 맞음, 1: 틀림)
      let formatCheckSuccess = true;
      try {
        await execa('clang-format', [
          '--dry-run', '--Werror', this.config.filePath
        ]);
        formatCheckSuccess = true; // 포맷 맞음
      } catch (checkErr: any) {
        if (checkErr.exitCode === 1) {
          formatCheckSuccess = false; // 포맷 틀림
        } else {
          // clang-format 실행 자체가 실패한 경우
          return {
            tool: 'clang-format',
            success: false,
            output: checkErr.stdout || checkErr.stderr || checkErr.message,
          };
        }
      }
      // 2. 실제 포맷 결과도 같이 반환
      const result = await execa('clang-format', [this.config.filePath]);
      return {
        tool: 'clang-format',
        success: formatCheckSuccess,
        output: result.stdout,
      };
    } catch (err: any) {
      return {
        tool: 'clang-format',
        success: false,
        output: err.stdout || err.stderr || err.message,
      };
    }
  }
} 