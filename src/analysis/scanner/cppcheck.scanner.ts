import { execa } from 'execa';
import { BaseScanner, ScannerConfig, ScannerResult } from './base.scanner';
import { execSync } from 'child_process';

export class CppcheckScanner extends BaseScanner {
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
            
      const result = await execa('cppcheck', [
        '--enable=all',
        '--inconclusive',
        '--std=c++17',
        '--suppress=missingIncludeSystem',
        '--suppress=noExplicitConstructor',
        this.config.filePath,
        '-I', `${sdkPath}/usr/include`,
        '-I', '/usr/include',
      ]);

      const output = result.stdout + (result.stderr ? '\n' + result.stderr : '');

      // 중요 심각도만 포함되었는지 검사
      const hasImportantIssues = /(?:error|warning|performance|portability|style):/.test(output);
      /*
        * 포함되는 cppcheck 메시지 종류:
        *
        *  error:        치명적인 오류 (예: 문법 오류, 정의되지 않은 식별자 등)
        *  warning:      잠재적 오류 또는 잘못된 논리 (예: 널 포인터 역참조 가능성)
        *  performance:  성능 저하 가능성 (예: 불필요한 연산, 비효율적 반복 등)
        *  portability:  이식성 문제 (예: 플랫폼/컴파일러 간 차이)
        *  style:        스타일 권장 위반 (예: 미사용 변수, 명시성 부족 등)
       */


      return {
        tool: 'cppcheck',
        success: !hasImportantIssues && result.exitCode === 0,
        output,
      };
    } catch (err: any) {
      const output = err.stdout || err.stderr || err.message;
      return {
        tool: 'cppcheck',
        success: false,
        output,
      };
    }
  }
}