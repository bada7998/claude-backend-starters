import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  const port = configService.get<number>('app.port') || 3000;
  const corsOrigin = configService.get<string>('app.corsOrigin') || '*';

  // Global API prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Interceptors
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TransformInterceptor(),
  );

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS Backend Starter API')
    .setDescription(
      `
      ## Production-ready NestJS + Prisma + PostgreSQL 백엔드 스타터킷

      ### 기술 스택
      - **Framework**: NestJS v10
      - **Database**: PostgreSQL + Prisma ORM
      - **Authentication**: JWT (Access Token 15분 + Refresh Token 7일)
      - **Authorization**: RBAC (USER, ADMIN 역할)

      ### 인증 방법
      1. \`POST /api/auth/register\` 또는 \`POST /api/auth/login\`으로 토큰 발급
      2. 우측 상단 **Authorize** 버튼 클릭
      3. \`Bearer {accessToken}\` 형식으로 입력
    `,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Access Token을 입력하세요',
        in: 'header',
      },
      'access-token',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Refresh Token을 입력하세요 (/auth/refresh 전용)',
        in: 'header',
      },
      'refresh-token',
    )
    .addTag('인증 (Auth)', 'JWT 기반 인증/인가')
    .addTag('사용자 (Users)', '사용자 CRUD')
    .addTag('게시글 (Posts)', '게시글 CRUD 예제')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port);

  console.log(`
====================================================
  NestJS Backend Starter Kit
====================================================
  App:     http://localhost:${port}/api
  Swagger: http://localhost:${port}/api/docs
  pgAdmin: http://localhost:5050 (admin@admin.com / admin)
====================================================
  `);
}

bootstrap();
