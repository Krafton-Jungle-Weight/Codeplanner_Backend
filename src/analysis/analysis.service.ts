import { Injectable } from '@nestjs/common';
import { CppcheckScanner } from './scanner/cppcheck.scanner';
import { ClangTidyScanner } from './scanner/clang-tidy.scanner';
import { ScannerConfig, ScannerResult } from './scanner/base.scanner';
import { AnalyzeRequest, AnalyzeResponse } from './dto/analyze-request.dto';
import { GithubService } from '../github/github.service';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly githubService: GithubService,
  ) {}
  /*
   * pr기준으로 모든 커밋을 분석
   *
   */
  async analyzeFiles(
    files: AnalyzeRequest[],
  ): Promise<
    { file: string; cppcheck: ScannerResult; clangTidy: ScannerResult }[]
  > {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    const results: AnalyzeResponse[] = [];
    const tempFiles: string[] = [];

    try {
      for (const file of files) {
        // 파일명에서 경로 구분자 제거하고 안전한 파일명 생성
        const safeFilename = file.filename
          .replace(/[\/\\]/g, '_')
          .replace(/[^a-zA-Z0-9._-]/g, '_');
        const tempPath = path.join(
          os.tmpdir(),
          `${Date.now()}-${safeFilename}`,
        );

        fs.writeFileSync(tempPath, file.content);
        tempFiles.push(tempPath);

        const config: ScannerConfig = {
          filePath: tempPath,
          language: file.language,
        };

        const cppcheck = new CppcheckScanner(config);
        const clangTidy = new ClangTidyScanner(config);
        /*
         * 결과의 출력 순서를 보장하는 promise.all
         * 두개의 실행은 계속 교차해서 발생
         */
        const [cppcheckResult, clangTidyResult] = await Promise.all([
          cppcheck.execute(),
          clangTidy.execute(),
        ]);
        const response: AnalyzeResponse = {
          file: file.filename,
          cppcheck: cppcheckResult,
          clangTidy: clangTidyResult,
        }

        results.push(response);
      }
      return results;
    } catch (error) {
      throw error;
    } finally {
      // 임시 파일들 정리
      for (const tempPath of tempFiles) {
        try {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        } catch (cleanupError) {}
      }
    }
  }

  // GitHub 커밋의 파일들을 분석
  async analyzeGitHubCommit(
    owner: string,
    repo: string,
    commitSha: string,
    userId: string,
  ): Promise<AnalyzeResponse[]> {
    // GitHub에서 커밋의 변경된 파일들을 가져옴
    const changedFiles = await this.githubService.getChangedFilesWithContent(
      owner,
      repo,
      commitSha,
      userId,
    );

    // C/C++ 파일만 필터링
    const cppFiles = changedFiles.filter(
      (file) => file.language === 'c' || file.language === 'cpp',
    );

    // AnalyzeRequest 형식으로 변환
    const analyzeRequests: AnalyzeRequest[] = changedFiles
      .filter((file) => file.language === 'c' || file.language === 'cpp')
      .map((file) => ({
        filename: file.filename,
        content: file.content,
        language: file.language as 'c' | 'cpp',
      }));

    return this.analyzeFiles(analyzeRequests);
  }

  // GitHub PR의 파일들을 분석
  async analyzeGitHubPullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    userId: string,
  ): Promise<AnalyzeResponse[]> {
    // GitHub에서 PR의 변경된 파일들을 가져옴
    const changedFiles = await this.githubService.getFilesChangedInPullRequest(
      owner,
      repo,
      pullNumber,
      userId,
    );

    // C/C++ 파일만 필터링
    const cppFiles = changedFiles.filter(
      (file) => file.language === 'c' || file.language === 'cpp',
    );

    // AnalyzeRequest 형식으로 변환
    const analyzeRequests: AnalyzeRequest[] = changedFiles
      .filter((file) => file.language === 'c' || file.language === 'cpp')
      .map((file) => ({
        filename: file.filename,
        content: file.content,
        language: file.language as 'c' | 'cpp',
      }));

    const result = await this.analyzeFiles(analyzeRequests);
    return result;
  }
}
