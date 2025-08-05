import { Injectable } from '@nestjs/common';
import { CppcheckScanner } from './scanner/cppcheck.scanner';
import { ClangTidyScanner } from './scanner/clang-tidy.scanner';
import { ClangFormatScanner } from './scanner/clang-format.scanner';
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
    { file: string; cppcheck: ScannerResult; clangTidy: ScannerResult; clangFormat: ScannerResult }[]
  > {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    const results: AnalyzeResponse[] = [];
    const tempFiles: string[] = [];

    console.time('analyzeFiles-total');
    try {
      for (const file of files) {
        // 파일명에서 경로 구분자 제거하고 안전한 파일명 생성
        const safeFilename = file.filename
          .replace(/[\/\\]/g, '_')
          .replace(/[^a-zA-Z0-9._-]/g, '_');
        const tempPath = path.join(os.tmpdir(),`${Date.now()}-${safeFilename}`);

        fs.writeFileSync(tempPath, file.content);
        tempFiles.push(tempPath);
        console.log("--------------------")
        console.log("파일 dir:" , tempPath)
        console.log("파일 명: ", safeFilename);
        console.log("--------------------")
        const config: ScannerConfig = {
          filePath: tempPath,
          language: file.language,
        };

        const cppcheck = new CppcheckScanner(config);
        const clangTidy = new ClangTidyScanner(config);
        const clangFormat = new ClangFormatScanner(config);
        /*
         * 결과의 출력 순서를 보장하는 promise.all
         * 세 개의 실행은 계속 교차해서 발생
         */
        console.time(`analyze-file-${file.filename}`);
        const [cppcheckResult, clangTidyResult, clangFormatResult] = await Promise.all([
          cppcheck.execute(),
          clangTidy.execute(),
          clangFormat.execute(),
        ]);
        console.timeEnd(`analyze-file-${file.filename}`);
        const response: AnalyzeResponse = {
          file: file.filename,
          cppcheck: cppcheckResult,
          clangTidy: clangTidyResult,
          clangFormat: clangFormatResult,
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
      console.timeEnd('analyzeFiles-total');
    }
  }

  // GitHub 커밋의 파일들을 분석
  async analyzeGitHubCommit(
    owner: string,
    repo: string,
    commitSha: string,
    userId: string,
  ): Promise<AnalyzeResponse[]> {
    console.time('github-fetch');
    // GitHub에서 커밋의 변경된 파일들을 가져옴
    const changedFiles = await this.githubService.getChangedFilesWithContent(
      owner,
      repo,
      commitSha,
      userId,
    );
    console.timeEnd('github-fetch');

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

    console.time('analyzeFiles-in-commit');
    const result = await this.analyzeFiles(analyzeRequests);
    console.timeEnd('analyzeFiles-in-commit');
    return result;
  }

  // GitHub PR의 파일들을 분석
  async analyzeGitHubPullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    userId: string,
  ): Promise<AnalyzeResponse[]> {
    console.time('github-fetch-pr');
    // GitHub에서 PR의 변경된 파일들을 가져옴
    const changedFiles = await this.githubService.getFilesChangedInPullRequest(
      owner,
      repo,
      pullNumber,
      userId,
    );
    console.timeEnd('github-fetch-pr');

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

    console.time('analyzeFiles-in-pr');
    const result = await this.analyzeFiles(analyzeRequests);
    console.timeEnd('analyzeFiles-in-pr');
    return result;
  }

  // GitHub PR의 최근 변경사항만 분석 (중복 제거)
  async analyzeGitHubPullRequestRecent(
    owner: string,
    repo: string,
    pullNumber: number,
    userId: string,
  ): Promise<AnalyzeResponse[]> {
    console.time('github-fetch-pr-recent');
    // GitHub에서 PR의 최근 변경된 파일들을 가져옴 (중복 제거)
    const changedFiles = await this.githubService.getRecentChangedFilesInPullRequest(
      owner,
      repo,
      pullNumber,
      userId,
    );
    console.timeEnd('github-fetch-pr-recent');

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

    console.time('analyzeFiles-in-pr-recent');
    const result = await this.analyzeFiles(analyzeRequests);
    console.timeEnd('analyzeFiles-in-pr-recent');
    return result;
  }

  async analysisGitHubChangedFile(
    owner: string,
    repo: string,
    sha: string,
    file: string | undefined,
    id: any
  ) {
    console.time('github-fetch-changed-file');
    const changedFiles = await this.githubService.getChangedFilesWithContent(
      owner, repo, sha, id,
    );
    console.timeEnd('github-fetch-changed-file');
    // 1. C/C++ 파일만 필터
    let cppFiles = changedFiles.filter(
      (f) => f.language === 'c' || f.language === 'cpp'
    );
    // 2. file 파라미터가 있으면 해당 파일만 필터
    if (file) {
      cppFiles = cppFiles.filter(f => f.filename === file);
    }
    // 3. 분석 요청 생성
    const analyzeRequests: AnalyzeRequest[] = cppFiles.map((f) => ({
      filename: f.filename,
      content: f.content,
      language: f.language as 'c' | 'cpp',
    }));
    console.time('analyzeFiles-in-changed-file');
    const result = await this.analyzeFiles(analyzeRequests);
    console.timeEnd('analyzeFiles-in-changed-file');
    return result;
  }
}
