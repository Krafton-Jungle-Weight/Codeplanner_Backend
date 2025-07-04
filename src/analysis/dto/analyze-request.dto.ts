export interface AnalyzeRequest {
  filename: string;
  content: string;
  language: 'c' | 'cpp';
}