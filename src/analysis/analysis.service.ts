import { Injectable } from '@nestjs/common';
import { CppcheckScanner } from './scanner/cppcheck.scanner';
import { ClangTidyScanner } from './scanner/clang-tidy.scanner';
import { ScannerConfig, ScannerResult } from './scanner/base.scanner';
import { AnalyzeRequest } from './dto/analyze-request.dto';
import { GitCommit } from './mockgit/mockgit';

@Injectable()
export class AnalysisService {

  constructor(private readonly gitService: GitCommit) {}

  async analyzeFiles(files: AnalyzeRequest[]): Promise<{ file: string; cppcheck: ScannerResult; clangTidy: ScannerResult }[]> {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const results: { file: string; cppcheck: ScannerResult; clangTidy: ScannerResult }[] = [];
    for (const file of files) {
      const tempPath = path.join(os.tmpdir(), path.basename(file.filename));
      fs.writeFileSync(tempPath, file.content);
      const config: ScannerConfig = { filePath: tempPath, language: file.language };
      const cppcheck = new CppcheckScanner(config);
      const clangTidy = new ClangTidyScanner(config);
      const [cppcheckResult, clangTidyResult] = await Promise.all([
        cppcheck.execute(),
        clangTidy.execute(),
      ]);
      results.push({
        file: file.filename,
        cppcheck: cppcheckResult,
        clangTidy: clangTidyResult,
      });
      fs.unlinkSync(tempPath);
    }
    return results;
  }

  async analyzeCommit(commitHash: string) {
    const files = this.gitService.getCommitFiles(commitHash);
    return this.analyzeFiles(files);
  }
} 