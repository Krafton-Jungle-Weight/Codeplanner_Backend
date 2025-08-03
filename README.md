# CodePlanner Backend

[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-8.16.3-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-UNLICENSED-lightgrey.svg)](LICENSE)

CodePlanner는 프로젝트 관리와 코드 분석을 통합한 협업 플랫폼의 백엔드 API 서버입니다. GitHub 연동, AI 기반 코드 분석, 기여도 분석, 프로젝트 타임라인 관리 등의 기능을 제공합니다.

## 🚀 주요 기능

### 📊 프로젝트 관리
- **프로젝트 생성 및 관리**: 프로젝트 정보, 멤버 관리, 권한 설정
- **이슈 트래킹**: 버그, 기능, 개선사항 등 다양한 이슈 타입 관리
- **댓글 시스템**: 이슈별 댓글 및 소통 기능
- **활동 추적**: 사용자별 활동 내역 및 통계

### 🔗 GitHub 연동
- **OAuth 인증**: GitHub 계정 연동 및 자동 로그인
- **커밋 동기화**: GitHub 커밋 내역 자동 수집
- **Pull Request 관리**: PR 생성, 리뷰, 머지 상태 추적
- **Webhook 지원**: 실시간 GitHub 이벤트 수신

### 🤖 AI 기반 분석
- **코드 품질 분석**: Clang-format, Clang-tidy, Cppcheck를 통한 정적 분석
- **기여도 분석**: 사용자별 활동 패턴 및 협업 스타일 분석
- **프로젝트 요약**: AI를 활용한 프로젝트 진행 상황 요약
- **피드백 생성**: 팀원 간 상호작용 기반 피드백 제공

### 📈 타임라인 및 통계
- **프로젝트 타임라인**: 전체 프로젝트 진행 상황 시각화
- **간트 차트**: 작업 일정 및 마감일 관리
- **통계 대시보드**: 프로젝트별 상세 통계 및 분석
- **멤버별 기여도**: 개인별 기여도 및 활동 패턴 분석

### 📧 알림 시스템
- **이메일 알림**: 이슈 할당, 댓글, 마감일 알림
- **실시간 알림**: 웹훅을 통한 실시간 이벤트 알림
- **초대 시스템**: 프로젝트 멤버 초대 및 관리

## 🛠 기술 스택

### Backend Framework
- **NestJS 11.0.1**: TypeScript 기반 Node.js 프레임워크
- **TypeScript 5.7.3**: 정적 타입 지원

### Database
- **PostgreSQL**: 메인 데이터베이스
- **TypeORM**: ORM 및 데이터베이스 마이그레이션

### Authentication & Security
- **JWT**: 토큰 기반 인증
- **bcrypt**: 비밀번호 해싱
- **GitHub OAuth**: 소셜 로그인

### External APIs
- **GitHub API**: 리포지토리 및 커밋 정보
- **Google Gemini AI**: AI 기반 분석 및 요약
- **AWS Bedrock**: 추가 AI 서비스
- **Nodemailer**: 이메일 발송

### Development Tools
- **ESLint**: 코드 품질 관리
- **Prettier**: 코드 포맷팅
- **Jest**: 테스트 프레임워크
- **Swagger**: API 문서화

## 📋 요구사항

### 시스템 요구사항
- Node.js 18.0.0 이상
- PostgreSQL 12.0 이상
- npm 또는 yarn

### 환경 변수
프로젝트 루트에 `.env.development` (개발환경) 또는 `.env.production` (배포환경) 파일을 생성하고 다음 환경변수들을 설정하세요:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=codeplanner

# JWT
JWT_SECRET=your_jwt_secret_key

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AI Services
GEMINI_SUMMARYAI_API_KEY=your_gemini_api_key
GEMINI_Doublecheck_API_KEY=your_gemini_doublecheck_api_key
GEMINI_FEEDBACK_API_KEY=your_gemini_feedback_api_key

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# CORS
CORS_ORIGIN=http://localhost:3000

# Port
PORT=5000
```

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/Codeplanner_Backend.git
cd Codeplanner_Backend
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
# 개발환경
cp .env.example .env.development
# 또는 배포환경
cp .env.example .env.production

# 환경변수 파일을 편집하여 필요한 값들을 설정
```

### 4. 데이터베이스 설정
PostgreSQL 데이터베이스를 생성하고 연결 정보를 환경변수에 설정하세요.

### 5. 애플리케이션 실행

#### 개발 모드
```bash
npm run start:dev
```

#### 프로덕션 모드
```bash
npm run build
npm run start:prod
```

#### PM2를 사용한 배포
```bash
npm run build
pm2 start ecosystem.config.js --env production
```

## 📚 API 문서

애플리케이션 실행 후 다음 URL에서 Swagger API 문서를 확인할 수 있습니다:
- **개발환경**: http://localhost:5000/api-docs
- **배포환경**: https://your-domain.com/api-docs

### 주요 API 엔드포인트

#### 인증
- `POST /auth/login` - 로그인
- `POST /auth/github` - GitHub OAuth 로그인
- `POST /auth/verify-reset-token` - 토큰 검증

#### 사용자 관리
- `POST /user/create` - 회원가입
- `GET /user/mypage` - 내 정보 조회
- `PUT /user/displayname` - 닉네임 변경

#### 프로젝트 관리
- `POST /project` - 프로젝트 생성
- `GET /project` - 프로젝트 목록 조회
- `GET /project/:id` - 프로젝트 상세 조회
- `PUT /project/:id` - 프로젝트 수정
- `DELETE /project/:id` - 프로젝트 삭제

#### 이슈 관리
- `POST /issues` - 이슈 생성
- `GET /issues/:projectId` - 프로젝트 이슈 목록
- `PUT /issues/:id` - 이슈 수정
- `DELETE /issues/:id` - 이슈 삭제

#### GitHub 연동
- `GET /github/commits/:owner/:repo` - 커밋 목록 조회
- `GET /github/pulls/:owner/:repo` - Pull Request 목록 조회
- `POST /github/webhook` - GitHub 웹훅 수신

#### AI 분석
- `POST /analysis/analyze` - 코드 품질 분석
- `POST /summaryai/analyze-contribution` - 기여도 분석

#### 타임라인
- `GET /timeline/:projectId/summary` - 프로젝트 요약
- `GET /timeline/:projectId/statistics` - 프로젝트 통계
- `GET /timeline/:projectId/gantt` - 간트 차트 데이터

## 🧪 테스트

### 단위 테스트
```bash
npm run test
```

### E2E 테스트
```bash
npm run test:e2e
```

### 테스트 커버리지
```bash
npm run test:cov
```

## 📦 배포

### Docker를 사용한 배포
```bash
# Docker 이미지 빌드
docker build -t codeplanner-backend .

# 컨테이너 실행
docker run -p 5000:5000 --env-file .env.production codeplanner-backend
```

### PM2를 사용한 배포
```bash
# 프로덕션 빌드
npm run build

# PM2로 실행
pm2 start ecosystem.config.js --env production

# 상태 확인
pm2 status

# 로그 확인
pm2 logs Codeplanner_Backend
```

## 🔧 개발 가이드

### 코드 스타일
- ESLint와 Prettier를 사용한 코드 포맷팅
- TypeScript strict 모드 사용
- NestJS 컨벤션 준수

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

### 커밋 메시지 규칙
```
type(scope): description

feat: 새로운 기능
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 프로세스 또는 보조 도구 변경
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 UNLICENSED 라이선스 하에 배포됩니다.

## 📞 지원

- **이슈 리포트**: [GitHub Issues](https://github.com/your-username/Codeplanner_Backend/issues)
- **문서**: [Wiki](https://github.com/your-username/Codeplanner_Backend/wiki)
- **이메일**: codeplanner0@gmail.com

## 🙏 감사의 말

- [NestJS](https://nestjs.com/) - 훌륭한 Node.js 프레임워크
- [TypeORM](https://typeorm.io/) - 강력한 ORM
- [GitHub API](https://developer.github.com/) - GitHub 연동
- [Google Gemini](https://ai.google.dev/) - AI 분석 서비스

---

**CodePlanner Backend** - 더 나은 협업을 위한 프로젝트 관리 플랫폼 🚀
