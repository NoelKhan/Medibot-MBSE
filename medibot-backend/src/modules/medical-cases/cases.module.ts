import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalCasesController } from './cases.controller';
import { MedicalCasesService } from './cases.service';
import { MedicalCase } from '../../database/entities/medical-case.entity';
import { CaseNote } from '../../database/entities/case-note.entity';
import { TriageAssessment } from '../../database/entities/triage-assessment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalCase, CaseNote, TriageAssessment])],
  controllers: [MedicalCasesController],
  providers: [MedicalCasesService],
  exports: [MedicalCasesService],
})
export class MedicalCasesModule {}
