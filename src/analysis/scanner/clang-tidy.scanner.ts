import { execa } from 'execa';
import { BaseScanner, ScannerConfig, ScannerResult } from './base.scanner';

export class ClangTidyScanner extends BaseScanner {
  constructor(config: ScannerConfig) {
    super(config);
  }
  

  async execute(): Promise<ScannerResult> {
    try {
      const { stdout, stderr } = await execa('clang-tidy', [
        this.config.filePath,
        '--',
        this.config.language === 'cpp' ? '-std=c++17' : '-std=c11',
      ]);
      return {
        tool: 'clang-tidy',
        success: true,
        output: stdout + (stderr ? '\n' + stderr : ''),
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