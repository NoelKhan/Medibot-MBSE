import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { PatientProfile } from '../../database/entities/patient-profile.entity';
import { MedicalHistory } from '../../database/entities/medical-history.entity';
import { Medication } from '../../database/entities/medication.entity';
import { Allergy } from '../../database/entities/allergy.entity';
import {
  UpdateUserDto,
  UpdateProfileDto,
  AddMedicalHistoryDto,
  AddMedicationDto,
  AddAllergyDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PatientProfile)
    private profileRepository: Repository<PatientProfile>,
    @InjectRepository(MedicalHistory)
    private historyRepository: Repository<MedicalHistory>,
    @InjectRepository(Medication)
    private medicationRepository: Repository<Medication>,
    @InjectRepository(Allergy)
    private allergyRepository: Repository<Allergy>,
  ) {}

  async getUser(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'profile.medicalHistory', 'profile.medications', 'profile.allergies'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash: _passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async updateUser(id: string, updateDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateDto);
    if (updateDto.dateOfBirth) {
      user.dateOfBirth = new Date(updateDto.dateOfBirth);
    }

    await this.userRepository.save(user);
    const { passwordHash: _passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    Object.assign(profile, updateDto);
    return this.profileRepository.save(profile);
  }

  async addMedicalHistory(userId: string, dto: AddMedicalHistoryDto) {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const history = this.historyRepository.create({
      patientId: profile.id,
      ...dto,
      diagnosedDate: dto.diagnosedDate ? new Date(dto.diagnosedDate) : null,
    });

    return this.historyRepository.save(history);
  }

  async getMedicalHistory(userId: string) {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['medicalHistory'],
    });
    return profile?.medicalHistory || [];
  }

  async addMedication(userId: string, dto: AddMedicationDto) {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const medication = this.medicationRepository.create({
      patientId: profile.id,
      ...dto,
      startDate: new Date(dto.startDate),
    });

    return this.medicationRepository.save(medication);
  }

  async getMedications(userId: string) {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['medications'],
    });
    return profile?.medications || [];
  }

  async addAllergy(userId: string, dto: AddAllergyDto) {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const allergy = this.allergyRepository.create({
      patientId: profile.id,
      ...dto,
    });

    return this.allergyRepository.save(allergy);
  }

  async getAllergies(userId: string) {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['allergies'],
    });
    return profile?.allergies || [];
  }
}
