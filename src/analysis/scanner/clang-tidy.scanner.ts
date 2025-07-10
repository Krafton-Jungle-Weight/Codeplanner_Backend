
import { execa } from 'execa';
import { BaseScanner, ScannerConfig, ScannerResult } from './base.scanner';
import { execSync } from 'child_process';

export class ClangTidyScanner extends BaseScanner {
  constructor(config: ScannerConfig) {
    super(config);
  }

  async execute(): Promise<ScannerResult> {
    try {
      // os에 따른 분기 처리 (우분투에선 sdk를 가져올 필요가 없어짐)
      const os = require('os');
      const isMac = os.platform() === 'darwin';

      const sdkPath = isMac
      ? execSync('xcrun --show-sdk-path').toString().trim()
      : '/usr/include'; // 리눅스 기본 경로
      
      const result = await execa('clang-tidy', [
        this.config.filePath,
        '--',
        this.config.language === 'cpp' ? '-std=c++17' : '-std=c11',
        '-isysroot', sdkPath,
        '-I', `${sdkPath}/usr/include`,
        '-I', '/usr/include',
      ]);

      const output = result.stdout + (result.stderr ? '\n' + result.stderr : '');

      const hasIssues = /(?:error|warning|note):/.test(output);

      return {
        tool: 'clang-tidy',
        success: !hasIssues && result.exitCode === 0,
        output,
      };
    } catch (err: any) {
      return {
        tool: 'clang-tidy',
        success: false,
        output: err.stdout || err.stderr || err.message,
      };
    }
  }
}
