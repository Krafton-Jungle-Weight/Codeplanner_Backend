import execa from 'execa';
import { BaseScanner, ScannerConfig, ScannerResult, ScannerIssue } from './base.scanner';
import { promises as fs } from 'fs';

export class ClangFormatScanner extends BaseScanner {
  constructor(config: ScannerConfig) {
    super(config);
  }

  async execute(): Promise<ScannerResult> {
    try {
      let formatCheckSuccess = true;
      let diffOutput = '';
      let issues: ScannerIssue[] = [];

      try {
        await execa('clang-format', ['--dry-run', '--Werror', this.config.filePath]);
      } catch (checkErr: any) {
        if (checkErr.exitCode === 1) {
          formatCheckSuccess = false;
          diffOutput = '[clang-format] 코드 스타일이 맞지 않습니다. 파일을 clang-format으로 자동 정렬해 주세요.';
          issues.push({
            file: this.config.filePath,
            line: 0,
            column: 0,
            type: 'style',
            message: diffOutput,
            checker: 'clang-format'
          });
        } else {
          return {
            tool: 'clang-format',
            success: false,
            output: '[clang-format] 실행 오류:\n' + (checkErr.stdout || '') + (checkErr.stderr ? '\n' + checkErr.stderr : '') + (checkErr.message ? '\n' + checkErr.message : ''),
            issues: []
          };
        }
      }

      const result = await execa('clang-format', [this.config.filePath]);
      return {
        tool: 'clang-format',
        success: formatCheckSuccess,
        output: formatCheckSuccess ? result.stdout : diffOutput,
        issues
      };
    } catch (err: any) {
      return {
        tool: 'clang-format',
        success: false,
        output: '[clang-format] 실행 오류:\n' + (err.stdout || '') + (err.stderr ? '\n' + err.stderr : '') + (err.message ? '\n' + err.message : ''),
        issues: []
      };
    }
  }
} 