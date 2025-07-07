/*
 * filepath, extension(확장자)
 */
export interface ScannerConfig {
  filePath: string;
  language: 'c' | 'cpp';
}

/*
 * 결과 출력용 
 */
export interface ScannerResult {
  tool: string;
  success: boolean;
  output: string;
}
/*
 * 실제 클래스가 아닌 추상클래스
 * execute와 config를 가진다.
 * config: filePath
 */
export abstract class BaseScanner {
  protected config: ScannerConfig;
  constructor(config: ScannerConfig) {
    this.config = config;
  }
  abstract execute(): Promise<ScannerResult>;
} 