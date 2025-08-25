
import execa from 'execa';
import { BaseScanner, ScannerConfig, ScannerResult, ScannerIssue } from './base.scanner';
import { execSync } from 'child_process';

export class ClangTidyScanner extends BaseScanner {
  constructor(config: ScannerConfig) {
    super(config);
  }

  async execute(): Promise<ScannerResult> {
    try {

      const os = require('os');
      const isMac = os.platform() === 'darwin';
      const sdkPath = isMac ? execSync('xcrun --show-sdk-path').toString().trim() : '/usr/include';

      const result = await execa('clang-tidy', [
        this.config.filePath,
        '--',
        this.config.language === 'cpp' ? '-std=c++17' : '-std=c11',
        '-isysroot', sdkPath,
        '-I', `${sdkPath}/usr/include`,
        '-I', '/usr/include'
      ]);

      const output = result.stdout + (result.stderr ? '\n' + result.stderr : '');
      const filteredOutput = output
        .split(/\r?\n/)
        .filter(line => !/file not found|No such file or directory|cannot open source file|fatal error:.*file not found/i.test(line))
        .join('\n');

      const hasIssues = /(?:error|warning|note):/.test(filteredOutput);

      // Parse issues from clang-tidy output
      const issues: ScannerIssue[] = [];
      const issueRegex = /^(.*?):(\d+):(\d+):\s+(error|warning|note):\s+(.*)\s+\[(\w+)\]/;
      
      for (const line of filteredOutput.split('\n')) {
        const match = line.match(issueRegex);
        if (match) {
          issues.push({
            file: match[1],
            line: parseInt(match[2], 10),
            column: parseInt(match[3], 10),
            type: match[4],
            message: match[5],
            checker: match[6]
          });
        }
      }

      return {
        tool: 'clang-tidy',
        success: !hasIssues && result.exitCode === 0,
        output: filteredOutput,
        issues
      };
    } catch (err: any) {
      return {
        tool: 'clang-tidy',
        success: false,
        output: err.stdout || err.stderr || err.message,
        issues: []
      };
    }
  }
}
