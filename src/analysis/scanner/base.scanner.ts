export interface ScannerConfig {
  filePath: string;
  language: 'c' | 'cpp';
}

export interface ScannerResult {
  tool: string;
  success: boolean;
  output: string;
}

export abstract class BaseScanner {
  protected config: ScannerConfig;
  constructor(config: ScannerConfig) {
    this.config = config;
  }
  abstract execute(): Promise<ScannerResult>;
} 