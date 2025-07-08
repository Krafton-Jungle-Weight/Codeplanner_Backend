// import { Body, Controller, Post, Req, Headers } from '@nestjs/common';
// import { GithubService } from 'src/github/github.service';
// import { AnalysisService } from '../analysis.service';

// @Controller('analysis/webhook')
// export class WebHookController {
//   constructor(
//     private readonly githubService: GithubService,
//     private readonly analysisService: AnalysisService,
//   ) {}
//   /*
//    * test용 webhook listen
//    * push와 pull-request 구분 코드
//    */
//   @Post()
//   async webhook(@Body() body: any, @Headers() headers: any) {
//     console.log('----------------------');
//     console.log('headers', headers);
//     console.log('webhook', body);
//     console.log('----------------------');
//     const type = headers['x-github-event'];
//     if (type == 'push') {
//       this.handlePushEvent(body);
//     } else if (type == 'pull-request') {
//       this.handlePullRequestEvent(body);
//     }
//   }
//   // push 이벤트 발생시 처리
//   private async handlePushEvent(body: any) {
//     const results: any[] = [];

//     if (body.commits && Array.isArray(body.commits)) {
//       const repositoryName = body.repository?.full_name || 'unknown';
//       for (const commit of body.commits) {
//         const commitInfo = {
//           repository: repositoryName,
//           commitMessage: commit.message,
//           authorName: commit.author?.name || 'unknown',
//           commitUrl: commit.url,
//           changedFiles: {
//             added: commit.added || [],
//             modified: commit.modified || [],
//             removed: commit.removed || [],
//           },
//           commitHash: commit.id,
//           timestamp: commit.timestamp,
//         };
//         console.log('추출된 커밋 정보:', commitInfo);
//       }

//       return {
//         status: 'success',
//         processedCommits: results.length,
//         results: results,
//       };
//     }
//   }
//   // pull-request 
//   private async handlePullRequestEvent(body: any) {
//     const results: any[] = [];

//     if (body.pull_request) {
//       const repositoryName = body.repository?.full_name || 'unknown';
//       const [owner, repo] = repositoryName.split('/');
//       const { number, head, base, title, user } = body.pull_request;
//       const action = body.action;

//       console.log(`PR #${number}: ${title} (${action})`);

//       try {
//         // PR의 변경된 파일들을 가져오기
//         const changedFiles =
//           await this.githubService.getFilesChangedInPullRequest(
//             owner,
//             repo,
//             number,
//             body.sender?.id || 'unknown',
//           );

//         // C/C++ 파일만 필터링
//         const cppFiles = changedFiles.filter(
//           (file) => file.language === 'c' || file.language === 'cpp',
//         );

//         if (cppFiles.length > 0) {
//           // 코드 분석 수행
//           const analysisResults = await this.analysisService.analyzeFiles(
//             cppFiles.map((file) => ({
//               filename: file.filename,
//               content: file.content,
//               language: file.language as 'c' | 'cpp',
//             })),
//           );

//           const prInfo = {
//             repository: repositoryName,
//             pullRequestNumber: number,
//             title: title,
//             author: user?.login || 'unknown',
//             action: action,
//             headSha: head?.sha,
//             baseSha: base?.sha,
//             changedFiles: {
//               total: changedFiles.length,
//               cppFiles: cppFiles.length,
//             },
//             analysisResults: analysisResults,
//           };

//           console.log('분석 완료된 PR 정보:', prInfo);
//           results.push(prInfo);
//         } else {
//           console.log('C/C++ 파일이 없어서 분석을 건너뜁니다.');
//           results.push({
//             repository: repositoryName,
//             pullRequestNumber: number,
//             title: title,
//             action: action,
//             message: 'No C/C++ files to analyze',
//           });
//         }
//       } catch (error) {
//         console.error('PR 분석 중 오류 발생:', error);
//         results.push({
//           pullRequestNumber: number,
//           error: error.message,
//         });
//       }
//     }

//     return {
//       status: 'success',
//       eventType: 'pull_request',
//       processedCommits: results.length,
//       results: results,
//     };
//   }
// }
