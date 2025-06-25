## 프로젝트 설명

코드 플래너 백엔드 리포지토리 입니다.

## 프로젝트 설치

```bash
$ npm install
```

## 프로젝트 컴파일 및 시작

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## 테스트 시작

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## 기본 폴더 지침
자신이 만든 기능은 ./modules 폴더 아래에 기능 별로
폴더를 생성한 후 거기서 관리하길 바랍니다.
루트 모듈은 app.module.ts로 해주세요.
