import { Injectable } from "@nestjs/common";
import { runClangTidy } from "./scanner/clang-tidy.scanner";
import { runCppcheck } from "./scanner/cppcheck.scanner";

@Injectable()
export class AnalysisService {
  async basicCodeAnalysis(){
    const tidyResult = await runClangTidy();
    const cppResult = await runCppcheck();
    return {
      clangTidy: tidyResult,
      cppcheck: cppResult,
    }
  }
}
