// 임시로 사용할 dto 구조, 필요 내용만 추가하고, 

import { ScannerResult } from "../scanner/base.scanner";

// 추후 commit json과 맞춰야 할 필요성 존재할 수도 있음
export interface AnalyzeRequest {
  filename: string;
  content: string;
  language: 'c' | 'cpp';
}

export interface AnalyzeResponse {
  file: string;
  cppcheck: ScannerResult; 
  clangTidy: ScannerResult
}
