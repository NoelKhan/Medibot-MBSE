import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { DoctorTimeOff } from './entities/doctor-time-off.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorProfile, DoctorSchedule, DoctorTimeOff]),
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
