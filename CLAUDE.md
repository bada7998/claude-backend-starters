# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 명령어

```bash
# 개발 서버
npm run start:dev          # watch 모드 개발 서버

# 빌드
npm run build              # TypeScript 컴파일 (dist/)
npm run start:prod         # 프로덕션 실행

# 데이터베이스
npm run db:up              # PostgreSQL 컨테이너 시작
npm run db:migrate         # Prisma 마이그레이션 (개발)
npm run db:migrate:prod    # Prisma 마이그레이션 (프로덕션)
npm run db:studio          # Prisma Studio GUI

# 테스트
npm run test               # 유닛 테스트
npm run test:watch         # watch 모드
npm run test:cov           # 커버리지 리포트
npm run test:e2e           # E2E 테스트
```

> NestJS CLI는 전역 설치되어 있지 않으므로 `npx nest` 사용

## 아키텍처 개요

### 글로벌 보호 패턴

모든 라우트는 기본적으로 JWT로 보호된다 (`APP_GUARD`로 전체 등록). 공개 접근이 필요한 엔드포인트에는 `@Public()` 데코레이터를 붙인다.

```
JwtAuthGuard (글로벌) → @Public() 데코레이터로 우회 가능
RolesGuard (글로벌) → @Roles(Role.ADMIN)으로 역할 제한
```

### 표준 응답 형식

모든 응답은 자동으로 래핑된다:
- **성공**: `TransformInterceptor` → `{ success, statusCode, message, data }`
- **오류**: `HttpExceptionFilter` → `{ success: false, statusCode, message, errors, timestamp, path }`

### 인증 흐름

1. Access Token (15분) + Refresh Token (7일) 발급
2. Refresh Token은 bcrypt 해시로 DB 저장 (Token Rotation)
3. `/auth/refresh` 호출 시 두 토큰 모두 새로 발급, DB의 이전 해시 교체
4. `/auth/logout` 호출 시 DB의 refreshToken을 null로 설정

### 모듈 구조

```
src/
├── auth/         - JWT 인증, 토큰 발급/검증/갱신
├── users/        - 사용자 CRUD (자기 자신만 수정, ADMIN은 전체 관리)
├── posts/        - 게시글 CRUD + 페이지네이션 + 검색 (공개 읽기, 인증 쓰기)
├── prisma/       - @Global() PrismaModule, PrismaService
├── config/       - app.config.ts(포트/CORS), jwt.config.ts(시크릿/만료)
└── common/
    ├── decorators/ - @Public(), @Roles(), @CurrentUser()
    ├── guards/     - RolesGuard
    ├── filters/    - HttpExceptionFilter
    └── interceptors/ - TransformInterceptor
```

## 핵심 설계 규칙

- **경로 별칭**: `@/` → `src/` (tsconfig paths)
- **ID 타입**: cuid (Prisma `@default(cuid())`)
- **DB 컬럼명**: snake_case (`@map`), TypeScript 필드명: camelCase
- **Swagger**: 모든 엔드포인트에 `@ApiOperation`, `@ApiResponse` 추가 필수
- **DTO 검증**: `class-validator` 데코레이터 사용, ValidationPipe가 글로벌 적용됨
- **TypeScript 설정**: `strictNullChecks: false`, `noImplicitAny: false` (유연한 타입)

## 환경 설정

`.env.example`을 참고해 `.env` 생성. Docker Compose로 PostgreSQL 16 제공:
- DB: `postgresql://postgres:password@localhost:5432/nestjs_starter`
- pgAdmin: `http://localhost:5050` (admin@admin.com / admin)
- Swagger: `http://localhost:3000/api/docs`
