import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalyzeRequest } from './dto/analyze-request.dto';
import { execa } from 'execa';
import { join } from 'path';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get()
  async analyzeExampleC() {
    const filePath = join(
      __dirname,
      '..',
      '..',
      '..',
      'src',
      'static',
      'code-samples',
      'example1.c',
    );
    // cppcheck 실행
    let cppcheckResult = '';
    try {
      const { stdout, stderr } = await execa('cppcheck', [
        '--enable=all',
        filePath,
      ]);
      cppcheckResult = stdout + (stderr ? '\n' + stderr : '');
    } catch (err: any) {
      cppcheckResult = err.stdout || err.stderr || err.message;
    }
    // clang-tidy 실행
    let clangTidyResult = '';
    try {
      const { stdout } = await execa(
        'clang-tidy',
        [filePath, '--', '-std=c11'],
        {
          env: { PATH: process.env.PATH },
        },
      );
      clangTidyResult = stdout;
    } catch (err: any) {
      clangTidyResult = err.stdout || err.stderr || err.message;
    }
    return {
      file: 'example1.c',
      cppcheck: cppcheckResult,
      clangTidy: clangTidyResult,
    };
  }

  @Post('analyze')
  async analyze(@Body() files: AnalyzeRequest[]) {
    return this.analysisService.analyzeFiles(files);
  }

  /*
  localhost:5000/analysis/commits/abc123
  [
    {
      "filename": "foo.c",
      "content": "#include <stdio.h>\nint main() { return 0; }",
      "language": "c"
    },
    {
      "filename": "bar.cpp",
      "content": "#include <iostream>\nint main() { return 0; }",
      "language": "cpp"
    }
  ]
  */

  @Get('commit/:gitHash')
  async gitCommitAnalyze(@Param('gitHash') gitHash: string) {
    return this.analysisService.analyzeCommit(gitHash);
  }
}
