## 데모용 DB 설정

### 유저 db 설정
```
INSERT INTO users (
id,
email,
display_name,
is_verified, -- 기본값 FALSE지만, 명시적으로 TRUE로 설정해도 좋습니다
password_hash, -- 실제로는 안전한 해시값을 넣어야 합니다
auth_provider
) VALUES (
'32b6ed8c-9cbc-463f-b44d-b624cd2f0d34', -- project 에서 참조할 UUID
'demo.leader@example.com',
'Demo Leader',
TRUE,
'changeme123!', -- 예시용 해시(실제 서비스에선 bcrypt 등으로 해시하세요)
'local'
);
```
### 프로젝트 db 설정
```
INSERT INTO project (
title,
descrition,
project_key,
leader_id,
repository_url,
due_date,
expires_at
) VALUES (
'Demo Project', -- 프로젝트 제목
'데모용 임시 프로젝트입니다.', -- 설명
'DEMO2025', -- 고유 project_key
'32b6ed8c-9cbc-463f-b44d-b624cd2f0d34', -- 위에서 생성한 Demo Leader UUID
'https://github.com/example/demo', -- 리포지토리 URL
'2025-12-31', -- 마감일
NOW() + INTERVAL '30 days' -- 만료일(현재 시점 + 30일)
);
```
### 이슈 db 설정
```
INSERT INTO issue (
project_id,
title,
description,
issue_type,
reporter_id
)
VALUES
(
'52d8a2a8-419d-4a9d-8122-efe0595aabad',
'Issue 1',
'testing',
'BUG',
gen_random_uuid()
),
(
'52d8a2a8-419d-4a9d-8122-efe0595aabad',
'Issue 2',
'testing',
'TASK',
gen_random_uuid()
),
(
'52d8a2a8-419d-4a9d-8122-efe0595aabad',
'Issue 3',
'testing',
'FEATURE',
gen_random_uuid()
),
(
'52d8a2a8-419d-4a9d-8122-efe0595aabad',
'Issue 4',
'testing',
'IMPROVEMENT',
gen_random_uuid()
);
```
데모 프로젝트 id: 32b6ed8c-9cbc-463f-b44d-b624cd2f0d34
