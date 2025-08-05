import { ScannerConfig, ScannerResult } from '../scanner/base.scanner';
import { ClangFormatScanner } from '../scanner/clang-format.scanner';
import { ClangTidyScanner } from '../scanner/clang-tidy.scanner';
import { CppcheckScanner } from '../scanner/cppcheck.scanner';
import { buildDepGraph, getAffectedFiles } from './dependency-graph';
import * as path from 'path';
import * as fs from 'fs';


type AnalysisResult = {
  file: string;
  cppcheck: ScannerResult;
  clangTidy: ScannerResult;
  clangFormat: ScannerResult;
};

async function runStaticAnalysisOnFiles(files: string[], language: 'c' | 'cpp'): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];
  for (const file of files) {
    const config: ScannerConfig = { filePath: file, language };
    const cppcheck = new CppcheckScanner(config);
    const clangTidy = new ClangTidyScanner(config);
    const clangFormat = new ClangFormatScanner(config);
    const [cppcheckResult, clangTidyResult, clangFormatResult] = await Promise.all([
      cppcheck.execute(),
      clangTidy.execute(),
      clangFormat.execute(),
    ]);
    results.push({
      file,
      cppcheck: cppcheckResult,
      clangTidy: clangTidyResult,
      clangFormat: clangFormatResult,
    });
  }
  return results;
}

function getSourceFilesFromObjectFiles(objectFiles: string[], depDir: string): string[] {
  const sourceFiles: string[] = [];
  for (const obj of objectFiles) {
    const dFile = obj.replace(/\\.o$/, '.d');
    const dFilePath = path.join(depDir, dFile);
    if (fs.existsSync(dFilePath)) {
      const content = fs.readFileSync(dFilePath, 'utf-8').replace(/\\\n/g, ' ');
      const parts = content.split(':');
      if (parts.length === 2) {
        const deps = parts[1].split(/\s+/).filter(Boolean);
        // .c, .cpp만 추출
        sourceFiles.push(...deps.filter(f => f.endsWith('.c') || f.endsWith('.cpp')));
      }
    }
  }
  return sourceFiles;
}

const depDir = path.resolve(__dirname, '../../../test_files');
const graph = buildDepGraph(depDir);

// 여러 테스트 케이스
const testCases = [
  ['defs.h'],
  ['main.c'],
  ['utils.h'],
  ['main.c', 'utils.h'],
];

testCases.forEach((changed) => {
  const affected = getAffectedFiles(changed, graph);
  console.log('------------------------------');
  console.log('Changed:', changed);
  console.log('Affected:', Array.from(affected));
});

// 예시: defs.h가 변경된 경우
const changed = ['defs.h'];
const affected = getAffectedFiles(changed, graph);

// 실제로 분석할 파일만 추림 (.c, .cpp)
const filesToAnalyze = Array.from(affected).filter(f => f.endsWith('.c') || f.endsWith('.cpp'));

// main 함수로 분석 실행
async function main() {
  console.log(affected);
  const filesToAnalyze = Array.from(affected)
    .filter(f => f.endsWith('.c') || f.endsWith('.cpp'))
    .map(f => path.resolve(depDir, f))
    .filter(f => require('fs').existsSync(f));

  if (filesToAnalyze.length === 0) {
    console.log('분석할 C/C++ 파일이 없습니다.');
    return;
  }
  const results = await runStaticAnalysisOnFiles(filesToAnalyze, 'c');
  for (const result of results) {
    console.log(`==== ${result.file} ====`);
    console.log('cppcheck:', result.cppcheck);
    console.log('clangTidy:', result.clangTidy);
    console.log('clangFormat:', result.clangFormat);
    console.log();
  }
}

main();