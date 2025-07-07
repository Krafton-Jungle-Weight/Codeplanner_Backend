import { execa } from 'execa';
import { BaseScanner, ScannerConfig, ScannerResult } from './base.scanner';

/*
 *
 *
 */
export class CppcheckScanner extends BaseScanner {
  constructor(config: ScannerConfig) {
    super(config);
  }

  async execute(): Promise<ScannerResult> {
    try {
      const { stdout, stderr } = await execa('cppcheck', [
        '--enable=all',
        this.config.filePath,
      ]);
      return {
        tool: 'cppcheck',
        success: true,
        output: stdout + (stderr ? '\n' + stderr : ''),
      };
    } catch (err: any) {
      return {
        tool: 'cppcheck',
        success: false,
        output: err.stdout || err.stderr || err.message,
      };
    }
  }
} 