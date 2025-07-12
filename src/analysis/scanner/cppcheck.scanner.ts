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
          // 시스템 헤더나 information/nofile 메시지는 제외
          if (!match[1].includes('/Library/Developer/CommandLineTools/SDKs/') && 
              !match[1].includes('nofile') && 
              match[4] !== 'information') {
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
      }

      // 딱 필요한 메시지만 필터링 (표시용)
      output = output
        .split(/\r?\n/)
        .filter(line => 
          !line.startsWith('Checking ') && 
          !line.startsWith("(information) Couldn't find path given by -I") && 
          line.trim() !== '' &&
          !line.includes('information:') && // information 메시지 제거
          !line.includes('note:') && // note 메시지 제거
          !line.includes('/Library/Developer/CommandLineTools/SDKs/') && // 시스템 헤더 제거
          !line.includes('nofile:') // nofile 메시지 제거
        )
        .join('\n');

      // 필터링된 output 기준으로 성공/실패 판단 (사용자가 보는 것 기준)
      const hasImportantIssues = /(?:error|warning|performance|portability|style):/.test(output);

      return {
        tool: 'cppcheck',
        success: !hasImportantIssues && result.exitCode === 0,
        output,
        issues: matches
      };
    } catch (err: any) {
      let output = err.stdout || err.stderr || err.message;
      
      // 딱 필요한 메시지만 필터링 (표시용)
      output = output
        .split(/\r?\n/)
        .filter(line => 
          !line.startsWith('Checking ') && 
          !line.startsWith("(information) Couldn't find path given by -I") && 
          line.trim() !== '' &&
          !line.includes('information:') && // information 메시지 제거
          !line.includes('note:') && // note 메시지 제거
          !line.includes('/Library/Developer/CommandLineTools/SDKs/') && // 시스템 헤더 제거
          !line.includes('nofile:') // nofile 메시지 제거
        )
        .join('\n');

      // 필터링된 output 기준으로 성공/실패 판단 (사용자가 보는 것 기준)
      const hasImportantIssues = /(?:error|warning|performance|portability|style):/.test(output);

      return {
        tool: 'cppcheck',
        success: !hasImportantIssues,
        output,
        issues: []
      };
    }
  }
}