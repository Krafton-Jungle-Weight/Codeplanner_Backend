const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3001;

app.use(express.json());

// Cppcheck 분석 엔드포인트
app.post('/api/analysis/cppcheck', async (req, res) => {
  const { content, language, filename } = req.body;
  
  try {
    // 임시 파일 생성
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `${Date.now()}-${filename || 'temp.c'}`);
    
    fs.writeFileSync(tempFile, content);
    
    // cppcheck 실행
    exec(`cppcheck --enable=all "${tempFile}"`, { timeout: 30000 }, (error, stdout, stderr) => {
      // 임시 파일 삭제
      try {
        fs.unlinkSync(tempFile);
      } catch (cleanupError) {
        console.error('임시 파일 삭제 실패:', cleanupError);
      }
      
      if (error) {
        console.error('Cppcheck 실행 오류:', error);
        return res.json({
          tool: 'cppcheck',
          success: false,
          output: error.message,
        });
      }
      
      const output = stdout + (stderr ? '\n' + stderr : '');
      
      res.json({
        tool: 'cppcheck',
        success: true,
        output: output,
      });
    });
  } catch (error) {
    res.status(500).json({
      tool: 'cppcheck',
      success: false,
      output: `서버 오류: ${error.message}`,
    });
  }
});

// Clang-tidy 분석 엔드포인트
app.post('/api/analysis/clang-tidy', async (req, res) => {
  const { content, language, filename } = req.body;
  
  try {
    // 임시 파일 생성
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `${Date.now()}-${filename || 'temp.c'}`);
    
    fs.writeFileSync(tempFile, content);
    
    // clang-tidy 실행
    const clangTidyCmd = language === 'cpp' ? 'clang-tidy' : 'clang-tidy';
    exec(`${clangTidyCmd} "${tempFile}" --`, { timeout: 30000 }, (error, stdout, stderr) => {
      // 임시 파일 삭제
      try {
        fs.unlinkSync(tempFile);
      } catch (cleanupError) {
        console.error('임시 파일 삭제 실패:', cleanupError);
      }
      
      if (error) {
        console.error('Clang-tidy 실행 오류:', error);
        return res.json({
          tool: 'clang-tidy',
          success: false,
          output: error.message,
        });
      }
      
      const output = stdout + (stderr ? '\n' + stderr : '');
      
      res.json({
        tool: 'clang-tidy',
        success: true,
        output: output,
      });
    });
  } catch (error) {
    res.status(500).json({
      tool: 'clang-tidy',
      success: false,
      output: `서버 오류: ${error.message}`,
    });
  }
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`분석 API 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`- Cppcheck: POST http://localhost:${PORT}/api/analysis/cppcheck`);
  console.log(`- Clang-tidy: POST http://localhost:${PORT}/api/analysis/clang-tidy`);
  console.log(`- Health check: GET http://localhost:${PORT}/health`);
}); 