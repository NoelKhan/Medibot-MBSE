/**
 * Reminders Service Unit Tests
 * =============================
 * Comprehensive tests for the RemindersService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RemindersService } from './reminders.service';
import { Reminder, ReminderType, ReminderStatus } from './entities/reminder.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('RemindersService', () => {
  let service: RemindersService;
  let reminderRepository: Repository<Reminder>;
  let notificationsService: NotificationsService;
  let emailService: EmailService;
  let dataSource: DataSource;

  const mockReminder = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user123',
    type: ReminderType.APPOINTMENT,
    title: 'Doctor Appointment',
    description: 'Visit with Dr. Smith',
    reminderTime: new Date('2024-12-31T10:00:00Z'),
    status: ReminderStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockNotificationsService = {
    getPreferences: jest.fn(),
    sendPushNotification: jest.fn(),
  };

  const mockEmailService = {
    sendAppointmentConfirmation: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        {
          provide: getRepositoryToken(Reminder),
          useValue: mockRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<RemindersService>(RemindersService);
    reminderRepository = module.get<Repository<Reminder>>(getRepositoryToken(Reminder));
    notificationsService = module.get<NotificationsService>(NotificationsService);
    emailService = module.get<EmailService>(EmailService);
    dataSource = module.get<DataSource>(DataSource);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('createReminder', () => {
    it('should create a reminder successfully', async () => {
      const createDto = {
        type: ReminderType.APPOINTMENT,
        title: 'Doctor Appointment',
        description: 'Visit with Dr. Smith',
        reminderTime: new Date('2024-12-31T10:00:00Z'),
      };

      mockRepository.create.mockReturnValue(mockReminder);
      mockRepository.save.mockResolvedValue(mockReminder);

      const result = await service.createReminder('user123', createDto);

      expect(result).toEqual(mockReminder);
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user123',
        ...createDto,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockReminder);
    });

    it('should throw BadRequestException if userId is missing', async () => {
      const createDto = {
        type: ReminderType.APPOINTMENT,
        title: 'Test',
        reminderTime: new Date(),
      };

      await expect(service.createReminder('', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if reminderTime is missing', async () => {
      const createDto = {
        type: ReminderType.APPOINTMENT,
        title: 'Test',
      } as any;

      await expect(service.createReminder('user123', createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserReminders', () => {
    it('should return user reminders excluding completed', async () => {
      const mockReminders = [mockReminder];
      mockRepository.find.mockResolvedValue(mockReminders);

      const result = await service.getUserReminders('user123', false);

      expect(result).toEqual(mockReminders);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user123', status: ReminderStatus.PENDING },
        order: { reminderTime: 'ASC' },
      });
    });

    it('should return all user reminders including completed', async () => {
      const mockReminders = [mockReminder];
      mockRepository.find.mockResolvedValue(mockReminders);

      const result = await service.getUserReminders('user123', true);

      expect(result).toEqual(mockReminders);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        order: { reminderTime: 'ASC' },
      });
    });
  });

  describe('updateReminder', () => {
    it('should update reminder successfully', async () => {
      const updateDto = { title: 'Updated Title' };
      mockRepository.findOne.mockResolvedValue(mockReminder);
      mockRepository.save.mockResolvedValue({ ...mockReminder, ...updateDto });

      const result = await service.updateReminder('reminder123', 'user123', updateDto);

      expect(result.title).toBe('Updated Title');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'reminder123', userId: 'user123' },
      });
    });

    it('should throw NotFoundException if reminder not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateReminder('reminder123', 'user123', { title: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelReminder', () => {
    it('should cancel reminder successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockReminder);
      mockRepository.save.mockResolvedValue({
        ...mockReminder,
        status: ReminderStatus.DISMISSED,
      });

      await service.cancelReminder('reminder123', 'user123');

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockReminder,
        status: ReminderStatus.DISMISSED,
      });
    });

    it('should throw NotFoundException if reminder not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.cancelReminder('reminder123', 'user123')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUpcomingReminders', () => {
    it('should return upcoming reminders for next 7 days', async () => {
      const mockReminders = [mockReminder];
      mockRepository.find.mockResolvedValue(mockReminders);

      const result = await service.getUpcomingReminders('user123');

      expect(result).toEqual(mockReminders);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('cancelAppointmentReminders', () => {
    it('should cancel all appointment reminders', async () => {
      mockRepository.update.mockResolvedValue({ affected: 2 });

      await service.cancelAppointmentReminders('appointment123', 'user123');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { appointmentId: 'appointment123', userId: 'user123', status: ReminderStatus.PENDING },
        { status: ReminderStatus.DISMISSED }
      );
    });
  });

  describe('createAppointmentReminder', () => {
    it('should create appointment reminders with transaction', async () => {
      const appointmentDate = new Date('2024-12-31T10:00:00Z');
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          create: jest.fn().mockReturnValue(mockReminder),
          save: jest.fn().mockResolvedValue(mockReminder),
        },
      };

      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
      mockNotificationsService.getPreferences.mockResolvedValue({
        reminderTimingPrimary: 60,
        reminderTimingSecondary: 1440,
      });

      const result = await service.createAppointmentReminder(
        'user123',
        'appointment123',
        appointmentDate,
        'Dr. Smith',
        60
      );

      expect(result).toHaveLength(2);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const appointmentDate = new Date('2024-12-31T10:00:00Z');
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          create: jest.fn().mockImplementation(() => {
            throw new Error('Database error');
          }),
        },
      };

      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
      mockNotificationsService.getPreferences.mockResolvedValue({
        reminderTimingPrimary: 60,
      });

      await expect(
        service.createAppointmentReminder(
          'user123',
          'appointment123',
          appointmentDate,
          'Dr. Smith',
          60
        )
      ).rejects.toThrow();

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
