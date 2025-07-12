import { execa } from 'execa';
import { BaseScanner, ScannerConfig, ScannerResult, ScannerIssue } from './base.scanner';
import { execSync } from 'child_process';

export class CppcheckScanner extends BaseScanner {
  constructor(config: ScannerConfig) {
    super(config);
  }

  async execute(): Promise<ScannerResult> {
    try {
      const os = require('os');
      const isMac = os.platform() === 'darwin';
      const sdkPath = isMac ? execSync('xcrun --show-sdk-path').toString().trim() : '/usr/include';

      const result = await execa('cppcheck', [
        '--enable=all',
        '--inconclusive',
        '--std=c++17',
        '--suppress=missingIncludeSystem',
        '--suppress=missingInclude',
        '--suppress=noExplicitConstructor',
        '--force',
        this.config.filePath,
        '-I', `${sdkPath}/usr/include`,
        '-I', '/usr/include'
      ]);

      let output = result.stdout + (result.stderr ? '\n' + result.stderr : '');
      const issueRegex = /^(.*?):(\d+):(\d+):\s+(style|error|warning|information):\s+(.*)\s+\[(\w+)\]/;
      const matches: ScannerIssue[] = [];

      for (const line of output.split('\n')) {
        const match = line.match(issueRegex);
        if (match) {
          matches.push({
            file: match[1],
            line: parseInt(match[2], 10),
            column: parseInt(match[3], 10),
            type: match[4],
            message: match[5],
            checker: match[6]
          });
        }
      }

      output = output
        .split(/\r?\n/)
        .filter(line => !line.startsWith('Checking ') && !line.startsWith("(information) Couldn't find path given by -I") && line.trim() !== '')
        .join('\n');

      const hasImportantIssues = /(?:error|warning|performance|portability|style):/.test(output);

      return {
        tool: 'cppcheck',
        success: !hasImportantIssues && result.exitCode === 0,
        output,
        issues: matches
      };
    } catch (err: any) {
      let output = err.stdout || err.stderr || err.message;
      output = output
        .split(/\r?\n/)
        .filter(line => !line.startsWith('Checking ') && !line.startsWith("(information) Couldn't find path given by -I") && line.trim() !== '')
        .join('\n');

      return {
        tool: 'cppcheck',
        success: false,
        output,
        issues: []
      };
    }
  }
}