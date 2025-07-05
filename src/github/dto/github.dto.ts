export type ChangedFileWithContent = {
  filename: string;
  status: 'added' | 'modified' | 'removed';
  language: 'c' | 'cpp' | 'text' | 'unknown';
  content: string;
  error?: string;
}