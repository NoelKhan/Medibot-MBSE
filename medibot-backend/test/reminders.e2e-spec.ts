/**
 * Reminders E2E Tests
 * ===================
 * End-to-end integration tests for the reminders API
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Reminder, ReminderType, ReminderStatus } from '../src/modules/reminders/entities/reminder.entity';
import { User } from '../src/database/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('Reminders API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;
  let reminderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    dataSource = app.get(DataSource);

    // Create test user and get auth token
    const userRepository = dataSource.getRepository(User);
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const testUser = await userRepository.save({
      email: 'test-reminders@example.com',
      passwordHash,
      fullName: 'Test User',
      isGuest: false,
      isActive: true,
    });
    
    userId = testUser.id;

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test-reminders@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Clean up test data
    const reminderRepository = dataSource.getRepository(Reminder);
    const userRepository = dataSource.getRepository(User);
    
    await reminderRepository.delete({ userId });
    await userRepository.delete({ id: userId });
    
    await app.close();
  });

  describe('/reminders (POST)', () => {
    it('should create a new reminder', async () => {
      const createDto = {
        type: 'test',
        title: 'Test Reminder',
        description: 'This is a test reminder',
        reminderTime: new Date('2025-12-31T10:00:00Z').toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(createDto.title);
      expect(response.body.type).toBe(createDto.type);
      expect(response.body.userId).toBe(userId);
      expect(response.body.status).toBe('pending');

      reminderId = response.body.id;
    });

    it('should return 400 for invalid reminder data', async () => {
      const invalidDto = {
        type: 'invalid_type',
        title: '',
      };

      await request(app.getHttpServer())
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const createDto = {
        type: 'test',
        title: 'Test Reminder',
        reminderTime: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/api/reminders')
        .send(createDto)
        .expect(401);
    });
  });

  describe('/reminders (GET)', () => {
    it('should get all user reminders', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/reminders')
        .expect(401);
    });
  });

  describe('/reminders/upcoming (GET)', () => {
    it('should get upcoming reminders', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/reminders/upcoming')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('/reminders/:id (GET)', () => {
    it('should get a specific reminder', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/reminders/${reminderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(reminderId);
      expect(response.body.userId).toBe(userId);
    });

    it('should return 404 for non-existent reminder', async () => {
      await request(app.getHttpServer())
        .get('/api/reminders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/reminders/:id (PATCH)', () => {
    it('should update a reminder', async () => {
      const updateDto = {
        title: 'Updated Reminder Title',
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/reminders/${reminderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.title).toBe(updateDto.title);
      expect(response.body.description).toBe(updateDto.description);
    });

    it('should return 404 for non-existent reminder', async () => {
      await request(app.getHttpServer())
        .patch('/api/reminders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test' })
        .expect(404);
    });
  });

  describe('/reminders/:id/status (PATCH)', () => {
    it('should update reminder status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/reminders/${reminderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.status).toBe('completed');
    });
  });

  describe('/reminders/:id (DELETE)', () => {
    it('should delete a reminder', async () => {
      await request(app.getHttpServer())
        .delete(`/api/reminders/${reminderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/api/reminders/${reminderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent reminder', async () => {
      await request(app.getHttpServer())
        .delete('/api/reminders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Concurrent operations', () => {
    it('should handle concurrent reminder creation', async () => {
      const createDto = {
        type: 'test',
        title: 'Concurrent Test',
        reminderTime: new Date('2025-12-31T10:00:00Z').toISOString(),
      };

      // Create 10 reminders concurrently
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/reminders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...createDto, title: `${createDto.title} ${i}` })
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.status).toBe(201);
        expect(result.body).toHaveProperty('id');
      });

      // Clean up
      const reminderRepository = dataSource.getRepository(Reminder);
      await reminderRepository.delete({ userId, title: /Concurrent Test/ as any });
    });
  });
});
