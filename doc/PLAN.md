# NestJS Backend Starter Kit - Implementation Plan

## Context

빈 디렉터리(`c:\DEV\claude-workspace\claude-backend-starters`)에 확장 가능하고 안정적인 백엔드 스타터킷을 구축한다.
사용자 선택 기술스택: **Node.js + TypeScript + NestJS + PostgreSQL + JWT Auth + Swagger**

---

## 기술 스택

| 레이어 | 기술 | 버전 |
|---|---|---|
| Framework | NestJS | v10+ |
| Language | TypeScript | v5.5+ |
| Database | PostgreSQL | v16 (Docker) |
| ORM | Prisma | v5.20+ |
| Auth | JWT (passport-jwt) | Access 15m / Refresh 7d |
| Validation | class-validator + class-transformer | v0.14+ |
| Documentation | @nestjs/swagger | v7+ |
| Container | Docker + docker-compose | - |

---

## 프로젝트 구조 (전체 파일 목록)

```
claude-backend-starters/
├── src/
│   ├── main.ts                              # Bootstrap, Swagger, global pipes/filters
│   ├── app.module.ts                        # Root module, global APP_GUARD 등록
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts               # POST /auth/register|login|logout|refresh
│   │   ├── auth.service.ts                  # register, login, logout, refreshTokens
│   │   ├── dto/
│   │   │   ├── register.dto.ts              # email, username, password (강한 검증)
│   │   │   ├── login.dto.ts                 # email, password
│   │   │   └── refresh-token.dto.ts
│   │   ├── strategies/
│   │   │   ├── jwt-access.strategy.ts       # Authorization: Bearer <accessToken>
│   │   │   └── jwt-refresh.strategy.ts      # Authorization: Bearer <refreshToken> + DB hash 검증
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts            # @Public() 메타데이터 체크 포함
│   │       └── jwt-refresh.guard.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts              # GET /users, GET/PATCH/DELETE /users/:id
│   │   ├── users.service.ts
│   │   └── dto/
│   │       └── update-user.dto.ts           # 생성은 auth/register로만
│   │
│   ├── posts/                               # CRUD 예제 리소스
│   │   ├── posts.module.ts
│   │   ├── posts.controller.ts              # GET(공개) / POST/PATCH/DELETE(인증)
│   │   ├── posts.service.ts
│   │   └── dto/
│   │       ├── create-post.dto.ts
│   │       ├── update-post.dto.ts
│   │       └── paginate-posts.dto.ts        # page, limit, search
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts                 # @Global() 모듈
│   │   └── prisma.service.ts                # PrismaClient + OnModuleInit/Destroy
│   │
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts     # 표준화된 에러 응답 포맷
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts     # 표준화된 성공 응답 래핑
│   │   ├── guards/
│   │   │   └── roles.guard.ts               # RBAC (USER / ADMIN)
│   │   └── decorators/
│   │       ├── public.decorator.ts          # @Public() - JWT 우회
│   │       ├── roles.decorator.ts           # @Roles(Role.ADMIN)
│   │       └── current-user.decorator.ts    # @CurrentUser()
│   │
│   └── config/
│       ├── app.config.ts
│       └── jwt.config.ts                    # accessSecret, refreshSecret, expiresIn
│
├── prisma/
│   └── schema.prisma                        # User, Post 모델
│
├── doc/
│   └── PLAN.md                              # 이 파일
│
├── .env.example
├── .env                                     # gitignore
├── .gitignore
├── docker-compose.yml                       # postgres:16 + pgAdmin
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
```

---

## Prisma 스키마 설계

```prisma
enum Role { USER ADMIN }

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  username      String   @unique
  passwordHash  String   @map("password_hash")    // @Exclude() in responses
  role          Role     @default(USER)
  refreshToken  String?  @map("refresh_token")    // bcrypt hash, null on logout
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  posts         Post[]
  @@map("users")
}

model Post {
  id          String   @id @default(cuid())
  title       String
  content     String
  published   Boolean  @default(false)
  authorId    String   @map("author_id")
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  @@map("posts")
}
```

---

## API 엔드포인트 설계

### Auth
| Method | Path | Auth | 설명 |
|---|---|---|---|
| POST | /api/auth/register | Public | 회원가입 → accessToken + refreshToken 반환 |
| POST | /api/auth/login | Public | 로그인 → 토큰 반환 |
| POST | /api/auth/logout | JWT | refreshToken DB 컬럼을 null로 초기화 |
| POST | /api/auth/refresh | RefreshJWT | 토큰 갱신 (Token Rotation) |

### Users
| Method | Path | Auth | 설명 |
|---|---|---|---|
| GET | /api/users | ADMIN | 전체 사용자 목록 |
| GET | /api/users/:id | JWT | 특정 사용자 조회 |
| PATCH | /api/users/:id | JWT | 본인 정보 수정 |
| DELETE | /api/users/:id | ADMIN | 사용자 삭제 |

### Posts (CRUD 예제)
| Method | Path | Auth | 설명 |
|---|---|---|---|
| GET | /api/posts | Public | 목록 조회 (페이지네이션 + 검색) |
| GET | /api/posts/:id | Public | 단건 조회 |
| POST | /api/posts | JWT | 게시글 생성 |
| PATCH | /api/posts/:id | JWT (작성자/ADMIN) | 게시글 수정 |
| DELETE | /api/posts/:id | JWT (작성자/ADMIN) | 게시글 삭제 |

---

## 표준화된 응답 포맷

```json
// 성공
{ "success": true, "statusCode": 200, "message": "Request successful", "data": {...} }

// 에러
{ "success": false, "statusCode": 400, "message": "Validation failed",
  "errors": ["email must be an email"], "timestamp": "...", "path": "/api/auth/register" }

// 페이지네이션
{ "success": true, "data": { "data": [...], "meta": { "total": 100, "page": 1, "limit": 10, "totalPages": 10 } } }
```

---

## 보안 설계 원칙

- `JWT_ACCESS_SECRET` ≠ `JWT_REFRESH_SECRET` (다른 시크릿 필수)
- Access Token: 15분 만료 (짧은 노출 창)
- Refresh Token: DB에 bcrypt 해시로 저장 → logout 시 null 처리로 즉시 무효화
- Token Rotation: `/auth/refresh` 호출 시 새로운 refresh token 발급 + 기존 해시 교체
- 글로벌 `JwtAuthGuard` → `@Public()` 데코레이터로만 우회 (기본값 보호)
- `whitelist: true` + `forbidNonWhitelisted: true` on ValidationPipe
- `ClassSerializerInterceptor` + `@Exclude()` 로 passwordHash, refreshToken 응답 제외
- 비밀번호: bcrypt 12 salt rounds

---

## 환경 변수 (.env.example)

```bash
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://postgres:password@localhost:5432/nestjs_starter?schema=public"

JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-different-refresh-secret-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
```

---

## 검증 방법

```
Swagger UI: http://localhost:3000/api/docs
pgAdmin:    http://localhost:5050  (admin@admin.com / admin)
```

**수동 테스트 시나리오:**
1. `POST /api/auth/register` → 사용자 생성
2. `POST /api/auth/login` → accessToken 수령
3. Swagger Authorize 버튼 → Bearer 토큰 입력
4. `POST /api/posts` → 게시글 생성
5. `GET /api/posts?page=1&limit=10&search=키워드` → 목록 + 페이지네이션 확인
6. `PATCH /api/posts/:id` → 수정 (본인만 가능)
7. 다른 사용자로 로그인 후 `PATCH /api/posts/:id` → 403 확인
8. `POST /api/auth/refresh` → 토큰 갱신
9. `POST /api/auth/logout` → 로그아웃 후 refresh 재시도 → 401 확인
