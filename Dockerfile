# ==================================
# 1. 빌드(Build) 단계
# ==================================
# Node.js 22 버전을 빌드 환경으로 사용합니다.
FROM node:22-alpine AS builder

WORKDIR /app

# 의존성 파일을 먼저 복사하여 캐싱 효과를 활용합니다.
COPY package*.json ./
RUN npm install

# 나머지 소스 코드를 복사합니다.
COPY . .

# NestJS 애플리케이션을 빌드합니다. (TypeScript -> JavaScript)
RUN npm run build

# ==================================
# 2. 실행(Runner) 단계
# ==================================
# 더 가벼운 이미지에서 시작합니다.
FROM node:18-alpine

WORKDIR /app

# 빌드 단계에서 생성된 파일들만 가져옵니다.
# 1. 빌드 결과물 (dist 폴더)
COPY --from=builder /app/dist ./dist
# 2. 실행에 필요한 의존성 파일들
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# RDS SSL 연결에 필요한 인증서 파일을 복사합니다.
COPY global-bundle.pem ./global-bundle.pem

# 5000번 포트를 외부에 노출합니다. (프로젝트 설정에 따라 포트 번호 변경)
EXPOSE 5000

# 애플리케이션을 실행하는 명령어를 설정합니다.
CMD ["node", "dist/main"]