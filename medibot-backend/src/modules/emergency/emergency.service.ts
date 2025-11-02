import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyCase } from '../../database/entities/emergency-case.entity';
import { CreateEmergencyDto, UpdateEmergencyDto } from './dto/emergency.dto';

@Injectable()
export class EmergencyService {
  constructor(
    @InjectRepository(EmergencyCase)
    private emergencyRepository: Repository<EmergencyCase>,
  ) {}

  async createEmergency(dto: CreateEmergencyDto) {
    const emergency = this.emergencyRepository.create({
      ...dto,
      status: 'pending',
    });

    return this.emergencyRepository.save(emergency);
  }

  async getEmergencies(userId?: string) {
    const where = userId ? { userId } : {};
    return this.emergencyRepository.find({
      where,
      relations: ['user', 'assignedStaff'],
      order: { timestamp: 'DESC' },
    });
  }

  async getEmergency(id: string) {
    const emergency = await this.emergencyRepository.findOne({
      where: { id },
      relations: ['user', 'assignedStaff'],
    });

    if (!emergency) {
      throw new NotFoundException('Emergency case not found');
    }

    return emergency;
  }

  async updateEmergency(id: string, dto: UpdateEmergencyDto) {
    const emergency = await this.getEmergency(id);

    Object.assign(emergency, dto);

    if (dto.status === 'resolved') {
      emergency.responseTime = new Date();
    }

    return this.emergencyRepository.save(emergency);
  }

  async assignStaff(id: string, staffId: string) {
    const emergency = await this.getEmergency(id);
    emergency.assignedStaffId = staffId;
    emergency.status = 'assigned';
    return this.emergencyRepository.save(emergency);
  }
}
