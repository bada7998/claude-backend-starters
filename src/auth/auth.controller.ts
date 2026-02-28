// NestJS 핵심 데코레이터 및 HTTP 유틸리티 임포트
// - Controller: 라우트 컨트롤러 선언
// - Post: HTTP POST 메서드 핸들러
// - Body: 요청 본문(Request Body) 파싱
// - HttpCode: 응답 HTTP 상태 코드 지정
// - HttpStatus: HTTP 상태 코드 상수 모음
// - UseGuards: 특정 엔드포인트에 Guard 적용
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

// Swagger 문서화를 위한 데코레이터 임포트
// - ApiTags: 엔드포인트를 Swagger UI에서 그룹으로 묶는 태그
// - ApiOperation: 각 엔드포인트의 요약/설명 정보 제공
// - ApiResponse: 응답 상태 코드별 문서 정의
// - ApiBearerAuth: Authorization 헤더에 Bearer 토큰이 필요함을 Swagger에 명시
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

// Prisma가 자동 생성한 User 모델 타입
import { User } from '@prisma/client';

// 인증 비즈니스 로직이 구현된 서비스
import { AuthService } from './auth.service';

// 회원가입 요청 데이터 유효성 검사 DTO
import { RegisterDto } from './dto/register.dto';

// 로그인 요청 데이터 유효성 검사 DTO
import { LoginDto } from './dto/login.dto';

// Refresh Token 전용 JWT Guard
// - Access Token Guard와 별도로 존재하며, Refresh Token의 유효성을 검증한다
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

// 글로벌 JWT Guard(APP_GUARD)를 우회하기 위한 커스텀 데코레이터
// - 이 데코레이터가 붙은 엔드포인트는 Access Token 없이도 접근 가능
import { Public } from '../common/decorators/public.decorator';

// JWT payload 또는 요청 객체에서 현재 로그인한 유저 정보를 추출하는 파라미터 데코레이터
// - @CurrentUser() → 전체 user 객체 반환
// - @CurrentUser('id') → user.id 값만 반환
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * 인증(Authentication) 컨트롤러
 *
 * 기본 경로: /api/auth
 *
 * 전체 라우트 목록:
 * - POST /api/auth/register  → 회원가입 (공개)
 * - POST /api/auth/login     → 로그인 (공개)
 * - POST /api/auth/logout    → 로그아웃 (Access Token 필요)
 * - POST /api/auth/refresh   → 토큰 갱신 (Refresh Token 필요)
 *
 * 토큰 전략:
 * - Access Token: 유효기간 15분, Authorization 헤더로 전달
 * - Refresh Token: 유효기간 7일, DB에 bcrypt 해시로 저장
 * - Token Rotation: 갱신 시마다 Refresh Token을 새로 발급하여 재사용 방지
 */
@ApiTags('인증 (Auth)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 회원가입
   *
   * 새로운 사용자 계정을 생성하고, 즉시 Access Token + Refresh Token을 반환한다.
   * 이메일과 사용자명은 시스템 전체에서 고유해야 한다.
   *
   * @Public() — 글로벌 JWT Guard를 우회하여 인증 없이 접근 가능
   * @param dto - 회원가입 정보 (email, username, password 등)
   * @returns accessToken, refreshToken, 사용자 정보
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '회원가입', description: 'Access Token + Refresh Token 반환' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 이메일/사용자명' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * 로그인
   *
   * 이메일과 비밀번호를 검증하고, Access Token + Refresh Token을 반환한다.
   * Refresh Token은 DB에 bcrypt 해시로 저장된다.
   *
   * @Public() — 글로벌 JWT Guard를 우회하여 인증 없이 접근 가능
   * @param dto - 로그인 정보 (email, password)
   * @returns accessToken, refreshToken, 사용자 정보
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인', description: 'Access Token + Refresh Token 반환' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '이메일 또는 비밀번호 불일치' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * 로그아웃
   *
   * DB에 저장된 사용자의 Refresh Token 해시를 null로 초기화한다.
   * 이후 해당 Refresh Token으로 토큰 갱신 요청 시 401 응답을 반환한다.
   *
   * @ApiBearerAuth — 글로벌 JWT Guard가 Access Token을 검증한다
   * @CurrentUser('id') — JWT payload에서 사용자 ID만 추출
   * @param userId - 현재 로그인한 사용자의 ID
   * @returns 로그아웃 완료 메시지
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '로그아웃', description: 'Refresh Token 무효화' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  /**
   * 토큰 갱신 (Token Rotation)
   *
   * Refresh Token을 검증하여 새로운 Access Token + Refresh Token 쌍을 발급한다.
   * 매 갱신 시마다 Refresh Token이 교체되어 탈취된 토큰의 재사용을 방지한다.
   *
   * 처리 흐름:
   * 1. @Public()으로 글로벌 Access Token Guard 우회
   * 2. @UseGuards(JwtRefreshGuard)로 Refresh Token 유효성 검증
   * 3. DB에 저장된 해시값과 요청의 Refresh Token을 bcrypt.compare로 비교
   * 4. 일치하면 새로운 토큰 쌍 발급 + DB의 Refresh Token 해시 갱신
   *
   * @Public() — Access Token Guard 우회 (Refresh Token Guard가 대신 검증)
   * @UseGuards(JwtRefreshGuard) — Refresh Token 서명 및 DB 저장값 검증
   * @param user - JwtRefreshGuard가 request.user에 주입한 유저 객체 (refreshToken 필드 포함)
   * @returns 새로운 accessToken, refreshToken
   */
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: '토큰 갱신',
    description: 'Refresh Token으로 새로운 Access Token + Refresh Token 발급 (Token Rotation)',
  })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 Refresh Token' })
  refresh(@CurrentUser() user: User & { refreshToken: string }) {
    return this.authService.refreshTokens(user);
  }
}
