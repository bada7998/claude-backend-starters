# NestJS Backend Starter Kit

Production-ready 백엔드 스타터킷 with NestJS + PostgreSQL + Prisma

## 기술 스택

| 레이어 | 기술 |
|---|---|
| Framework | NestJS v10 |
| Language | TypeScript v5 |
| Database | PostgreSQL v16 |
| ORM | Prisma v5 |
| Auth | JWT (Access 15m + Refresh 7d) |
| Validation | class-validator |
| Documentation | Swagger/OpenAPI |
| Container | Docker + docker-compose |

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일에서 JWT 시크릿 등 설정 수정
```

### 3. 데이터베이스 시작 (Docker)

```bash
npm run db:up
# 또는
docker-compose up -d postgres
```

### 4. Prisma 마이그레이션 실행

```bash
npm run db:migrate
# 또는
npx prisma migrate dev --name init
```

### 5. 개발 서버 시작

```bash
npm run start:dev
```

### 접속 주소

| 서비스 | URL |
|---|---|
| API | http://localhost:3000/api |
| Swagger UI | http://localhost:3000/api/docs |
| pgAdmin | http://localhost:5050 |

pgAdmin 로그인: `admin@admin.com` / `admin`

---

## API 엔드포인트

### 인증 (Auth)

| Method | Path | 설명 | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | 회원가입 | Public |
| POST | `/api/auth/login` | 로그인 | Public |
| POST | `/api/auth/logout` | 로그아웃 | JWT |
| POST | `/api/auth/refresh` | 토큰 갱신 | Refresh Token |

### 사용자 (Users)

| Method | Path | 설명 | Auth |
|---|---|---|---|
| GET | `/api/users` | 전체 사용자 목록 | ADMIN |
| GET | `/api/users/:id` | 특정 사용자 조회 | JWT |
| PATCH | `/api/users/:id` | 사용자 정보 수정 | JWT (본인) |
| DELETE | `/api/users/:id` | 사용자 삭제 | ADMIN |

### 게시글 (Posts) - CRUD 예제

| Method | Path | 설명 | Auth |
|---|---|---|---|
| GET | `/api/posts` | 게시글 목록 (페이지네이션 + 검색) | Public |
| GET | `/api/posts/:id` | 게시글 단건 조회 | Public |
| POST | `/api/posts` | 게시글 생성 | JWT |
| PATCH | `/api/posts/:id` | 게시글 수정 | JWT (작성자/ADMIN) |
| DELETE | `/api/posts/:id` | 게시글 삭제 | JWT (작성자/ADMIN) |

---

## 응답 포맷

### 성공 응답

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": { ... }
}
```

### 에러 응답

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["email must be an email"],
  "timestamp": "2026-02-28T10:00:00.000Z",
  "path": "/api/auth/register"
}
```

### 페이지네이션 응답

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": {
    "data": [ ... ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

---

## 인증 흐름

```
Register/Login → accessToken (15분) + refreshToken (7일)
                ↓
         API 요청시 Authorization: Bearer {accessToken}
                ↓
         accessToken 만료 → POST /api/auth/refresh
                         Authorization: Bearer {refreshToken}
                ↓
         새로운 accessToken + refreshToken 발급 (Token Rotation)
```

---

## 보안 설계

- **Access Token**: 15분 만료 (짧은 노출 창)
- **Refresh Token**: DB에 bcrypt 해시 저장 (logout 시 null → 즉시 무효화)
- **Token Rotation**: refresh 호출 시마다 새 refresh token 발급
- **기본 보호**: 모든 라우트가 JWT 필요, `@Public()` 데코레이터로만 우회
- **RBAC**: `@Roles(Role.ADMIN)` 데코레이터로 역할 기반 접근 제어
- **입력 검증**: `whitelist: true`로 선언되지 않은 필드 자동 제거

---

## 주요 스크립트

```bash
npm run start:dev     # 개발 서버 (watch 모드)
npm run start:prod    # 프로덕션 서버
npm run build         # 빌드

npm run db:up         # PostgreSQL Docker 컨테이너 시작
npm run db:down       # Docker 컨테이너 종료
npm run db:migrate    # Prisma 마이그레이션 실행
npm run db:generate   # Prisma 클라이언트 생성
npm run db:studio     # Prisma Studio (DB GUI)
npm run db:reset      # DB 초기화 (개발용)

npm run test          # 단위 테스트
npm run test:e2e      # E2E 테스트
npm run test:cov      # 테스트 커버리지
```

---

## 프로젝트 구조

```
src/
├── auth/               # JWT 인증/인가
│   ├── dto/            # register, login DTO
│   ├── guards/         # JwtAuthGuard, JwtRefreshGuard
│   └── strategies/     # jwt-access, jwt-refresh Passport 전략
├── users/              # 사용자 CRUD
├── posts/              # 게시글 CRUD (예제)
├── prisma/             # PrismaService (전역)
├── common/
│   ├── decorators/     # @Public, @Roles, @CurrentUser
│   ├── filters/        # HttpExceptionFilter (표준 에러 응답)
│   ├── guards/         # RolesGuard (RBAC)
│   └── interceptors/   # TransformInterceptor (표준 성공 응답)
└── config/             # app.config, jwt.config
```
