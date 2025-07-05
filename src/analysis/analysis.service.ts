import { Injectable } from '@nestjs/common';
import { CppcheckScanner } from './scanner/cppcheck.scanner';
import { ClangTidyScanner } from './scanner/clang-tidy.scanner';
import { ScannerConfig, ScannerResult } from './scanner/base.scanner';
import { AnalyzeRequest } from './dto/analyze-request.dto';
import { GitService } from './mockgit/mockgit';
import { GithubService } from '../github/github.service';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly gitService: GitService,
    private readonly githubService: GithubService,
  ) {}

  async analyzeFiles(files: AnalyzeRequest[]): Promise<{ file: string; cppcheck: ScannerResult; clangTidy: ScannerResult }[]> {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    const results: { file: string; cppcheck: ScannerResult; clangTidy: ScannerResult }[] = [];
    const tempFiles: string[] = [];

    try {
      console.log(`[Analysis] 파일 분석 시작: ${files.length}개 파일`);
      
      for (const file of files) {
        // 파일명에서 경로 구분자 제거하고 안전한 파일명 생성
        const safeFilename = file.filename.replace(/[\/\\]/g, '_').replace(/[^a-zA-Z0-9._-]/g, '_');
        const tempPath = path.join(os.tmpdir(), `${Date.now()}-${safeFilename}`);
        
        console.log(`[Analysis] 임시 파일 생성: ${tempPath}`);
        fs.writeFileSync(tempPath, file.content);
        tempFiles.push(tempPath);

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

        console.log(`[Analysis] 파일 분석 완료: ${file.filename}`);
      }

      return results;
    } catch (error) {
      console.error(`[Analysis] 파일 분석 중 오류 발생:`, error);
      throw error;
    } finally {
      // 임시 파일들 정리
      console.log(`[Analysis] 임시 파일 정리 시작: ${tempFiles.length}개 파일`);
      for (const tempPath of tempFiles) {
        try {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
            console.log(`[Analysis] 임시 파일 정리 완료: ${tempPath}`);
          }
        } catch (cleanupError) {
          console.warn(`[Analysis] 임시 파일 정리 실패: ${tempPath}`, cleanupError.message);
        }
      }
    }
  }

  async analyzeCommit(commitHash: string): Promise<{ file: string; cppcheck: ScannerResult; clangTidy: ScannerResult }[]> {
    const files = this.gitService.getCommitFiles(commitHash);
    console.log("service input = ", commitHash);
    return this.analyzeFiles(files);
  }

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
      console.log(`[Analysis] GitHub PR 분석 시작: ${owner}/${repo}#${pullNumber}, 사용자: ${userId}`);
      
      // GitHub에서 PR의 변경된 파일들을 가져옴
      console.log(`[Analysis] GitHub API 호출 시작...`);
      const changedFiles = await this.githubService.getFilesChangedInPullRequest(
        owner,
        repo,
        pullNumber,
        userId,
      );
      console.log(`[Analysis] GitHub API 호출 완료: ${changedFiles.length}개 파일`);

      // C/C++ 파일만 필터링
      const cppFiles = changedFiles.filter(
        (file) => file.language === 'c' || file.language === 'cpp',
      );
      console.log(`[Analysis] C/C++ 파일 수: ${cppFiles.length}`);

      // AnalyzeRequest 형식으로 변환
      const analyzeRequests: AnalyzeRequest[] = changedFiles
        .filter((file) => file.language === 'c' || file.language === 'cpp')
        .map((file) => ({
          filename: file.filename,
          content: file.content,
          language: file.language as 'c' | 'cpp',
        }));

      console.log(`[Analysis] 분석할 파일 목록:`, analyzeRequests.map(f => f.filename));
      console.log(`[Analysis] GitHub PR 분석: #${pullNumber}, 파일 수: ${analyzeRequests.length}`);
      
      const result = await this.analyzeFiles(analyzeRequests);
      console.log(`[Analysis] 분석 완료: ${result.length}개 파일 분석됨`);
      return result;
    } catch (error) {
      console.error(`[Analysis] GitHub PR 분석 실패:`, error);
      console.error(`[Analysis] 에러 메시지: ${error.message}`);
      console.error(`[Analysis] 에러 스택:`, error.stack);
      throw error;
    }
  }
}