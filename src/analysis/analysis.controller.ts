import { Controller, Get } from "@nestjs/common";
import { AnalysisService } from "./analysis.service";
import { runCppcheck } from "./scanner/cppcheck.scanner";
import { runClangTidy } from "./scanner/clang-tidy.scanner";

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}
  @Get('c')
  async codeBasicAnalysis(){
    return this.analysisService.basicCodeAnalysis();
  }
}
