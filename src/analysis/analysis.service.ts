import { Injectable } from '@nestjs/common';
import { CppcheckScanner } from './scanner/cppcheck.scanner';
import { ClangTidyScanner } from './scanner/clang-tidy.scanner';
import { ScannerConfig, ScannerResult } from './scanner/base.scanner';
import { AnalyzeRequest } from './dto/analyze-request.dto';
import { GithubService } from '../github/github.service';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly githubService: GithubService,
  ) {}

  async analyzeFiles(files: AnalyzeRequest[]): Promise<{ file: string; cppcheck: ScannerResult; clangTidy: ScannerResult }[]> {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    const results: { file: string; cppcheck: ScannerResult; clangTidy: ScannerResult }[] = [];

    for (const file of files) {
      const tempPath = path.join(os.tmpdir(), `${Date.now()}-${file.filename}`); // 중복 방지
      fs.writeFileSync(tempPath, file.content);

      const config: ScannerConfig = {
        filePath: tempPath,
        language: file.language,
      };

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

  // async analyzeCommit(commitHash: string): Promise<{ file: string; cppcheck: ScannerResult; clangTidy: ScannerResult }[]> {
  //   const files = this.gitService.getCommitFiles(commitHash);
  //   console.log("service input = ", commitHash);
  //   return this.analyzeFiles(files);
  // }

  // GitHub 커밋의 파일들을 분석
  async analyzeGitHubCommit(
    owner: string,
    repo: string,
    commitSha: string,
    userId: string,
  ): Promise<{ file: string; cppcheck: ScannerResult; clangTidy: ScannerResult }[]> {
    try {
      // GitHub에서 커밋의 변경된 파일들을 가져옴
      const changedFiles = await this.githubService.getChangedFilesWithContent(
        owner,
        repo,
        commitSha,
        userId,
      );

      // C/C++ 파일만 필터링하고 타입 변환
      const analyzeRequests: AnalyzeRequest[] = changedFiles
        .filter((file) => file.language === 'c' || file.language === 'cpp')
        .map((file) => ({
          filename: file.filename,
          content: file.content,
          language: file.language as 'c' | 'cpp',
        }));

      console.log(`[Analysis] GitHub 커밋 분석: ${commitSha}, 파일 수: ${analyzeRequests.length}`);
      return this.analyzeFiles(analyzeRequests);
    } catch (error) {
      console.error(`[Analysis] GitHub 커밋 분석 실패: ${error.message}`);
      throw error;
    }
  }

  // GitHub PR의 파일들을 분석
  async analyzeGitHubPullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    userId: string,
  ): Promise<{ file: string; cppcheck: ScannerResult; clangTidy: ScannerResult }[]> {
    try {
      // GitHub에서 PR의 변경된 파일들을 가져옴
      const changedFiles = await this.githubService.getFilesChangedInPullRequest(
        owner,
        repo,
        pullNumber,
        userId,
      );

      // C/C++ 파일만 필터링하고 타입 변환
      const analyzeRequests: AnalyzeRequest[] = changedFiles
        .filter((file) => file.language === 'c' || file.language === 'cpp')
        .map((file) => ({
          filename: file.filename,
          content: file.content,
          language: file.language as 'c' | 'cpp',
        }));

      console.log(`[Analysis] GitHub PR 분석: #${pullNumber}, 파일 수: ${analyzeRequests.length}`);
      return this.analyzeFiles(analyzeRequests);
    } catch (error) {
      console.error(`[Analysis] GitHub PR 분석 실패: ${error.message}`);
      throw error;
    }
  }
}
