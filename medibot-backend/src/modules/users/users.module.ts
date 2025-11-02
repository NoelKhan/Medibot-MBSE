import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../database/entities/user.entity';
import { PatientProfile } from '../../database/entities/patient-profile.entity';
import { MedicalHistory } from '../../database/entities/medical-history.entity';
import { Medication } from '../../database/entities/medication.entity';
import { Allergy } from '../../database/entities/allergy.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      PatientProfile,
      MedicalHistory,
      Medication,
      Allergy,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
