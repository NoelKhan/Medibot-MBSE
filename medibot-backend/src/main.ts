/**
 * MediBot Backend - Main Application Entry Point
 * ===============================================
 * NestJS application bootstrap with security middleware
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';

async function bootstrap() {
  // Create app with Winston logger
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });
  
  // Get configuration
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port');
  const apiPrefix = configService.get<string>('app.apiPrefix');
  const corsOrigin = configService.get<string[]>('app.cors.origin');

  // Security: Helmet middleware for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // Set global API prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS for Expo Go and web app
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 3600,
  });

  // Global validation pipe (validates DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide validation details in production
    }),
  );

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MediBot Healthcare API')
    .setDescription('Backend API for MediBot mobile and web application')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'Patient user management')
    .addTag('cases', 'Medical case tracking')
    .addTag('bookings', 'Appointment booking')
    .addTag('emergency', 'Emergency services')
    .addTag('staff', 'Staff management')
    .addTag('reminders', 'Reminder management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful shutdown
  app.enableShutdownHooks();

  // Start server - Listen on all network interfaces for mobile device access
  await app.listen(port, '0.0.0.0');

  const corsInfo = typeof corsOrigin === 'boolean' && corsOrigin 
    ? 'All origins (development mode)' 
    : Array.isArray(corsOrigin) ? corsOrigin.join(', ') : 'Restricted';

  console.log('\n🚀 ============================================');
  console.log('   MediBot Backend Server Started Successfully');
  console.log('   ============================================');
  console.log(`   🌐 Server running on: http://localhost:${port}`);
  console.log(`   📚 API Docs: http://localhost:${port}/api/docs`);
  console.log(`   🔌 API Endpoints: http://localhost:${port}/${apiPrefix}`);
  console.log(`   📱 CORS: ${corsInfo}`);
  console.log(`   🔒 Security: Enabled (Helmet)`);
  console.log(`   📝 Logging: Winston (${process.env.LOG_LEVEL || 'info'})`);
  console.log('   ============================================\n');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start backend server:', error);
  process.exit(1);
});
