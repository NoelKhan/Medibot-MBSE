import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalCase } from '../../database/entities/medical-case.entity';
import { CaseNote } from '../../database/entities/case-note.entity';
import { TriageAssessment } from '../../database/entities/triage-assessment.entity';
import { CreateCaseDto, UpdateCaseDto, AddCaseNoteDto, CreateTriageDto, CreateFollowupDto } from './dto/case.dto';

@Injectable()
export class MedicalCasesService {
  constructor(
    @InjectRepository(MedicalCase)
    private caseRepository: Repository<MedicalCase>,
    @InjectRepository(CaseNote)
    private noteRepository: Repository<CaseNote>,
    @InjectRepository(TriageAssessment)
    private triageRepository: Repository<TriageAssessment>,
  ) {}

  async createCase(createDto: CreateCaseDto) {
    const caseNumber = `CASE-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    const medicalCase = this.caseRepository.create({
      ...createDto,
      caseNumber,
      status: 'open',
      createdBy: 'bot',
    });

    return this.caseRepository.save(medicalCase);
  }

  async getCases(patientId?: string) {
    const where = patientId ? { patientId } : {};
    return this.caseRepository.find({
      where,
      relations: ['patient', 'assignedStaff', 'notes', 'triageAssessments'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCase(id: string) {
    const medicalCase = await this.caseRepository.findOne({
      where: { id },
      relations: ['patient', 'assignedStaff', 'notes', 'triageAssessments'],
    });

    if (!medicalCase) {
      throw new NotFoundException('Case not found');
    }

    return medicalCase;
  }

  async updateCase(id: string, updateDto: UpdateCaseDto) {
    const medicalCase = await this.getCase(id);

    Object.assign(medicalCase, updateDto);

    if (updateDto.status === 'closed') {
      medicalCase.closedAt = new Date();
    }

    return this.caseRepository.save(medicalCase);
  }

  async addNote(caseId: string, authorId: string, authorType: string, dto: AddCaseNoteDto) {
    const medicalCase = await this.getCase(caseId);

    const note = this.noteRepository.create({
      caseId: medicalCase.id,
      authorId,
      authorType,
      content: dto.content,
      noteType: dto.noteType || 'general',
      isVisibleToPatient: dto.isVisibleToPatient ?? true,
    });

    return this.noteRepository.save(note);
  }

  async getNotes(caseId: string) {
    return this.noteRepository.find({
      where: { caseId },
      order: { createdAt: 'DESC' },
    });
  }

  async createTriage(caseId: string, assessedBy: string, dto: CreateTriageDto) {
    const medicalCase = await this.getCase(caseId);

    const triage = this.triageRepository.create({
      caseId: medicalCase.id,
      assessedBy,
      ...dto,
    });

    return this.triageRepository.save(triage);
  }

  async getTriageHistory(caseId: string) {
    return this.triageRepository.find({
      where: { caseId },
      order: { assessedAt: 'DESC' },
    });
  }

  /**
   * Assign case to a staff member
   */
  async assignCase(caseId: string, staffId: string, assignedBy: string) {
    const medicalCase = await this.getCase(caseId);

    medicalCase.assignedStaffId = staffId;
    medicalCase.status = 'in-progress';

    await this.caseRepository.save(medicalCase);

    // Add a note about the assignment
    await this.addNote(
      caseId,
      assignedBy,
      'staff',
      {
        content: `Case assigned to staff member ${staffId}`,
        noteType: 'administrative',
        isVisibleToPatient: false,
      },
    );

    return medicalCase;
  }

  /**
   * Create a followup entry for a case
   */
  async createFollowup(caseId: string, createdBy: string, dto: CreateFollowupDto) {
    const medicalCase = await this.getCase(caseId);

    // For now, store followup as a note with special type
    // TODO: Create separate followup table if needed
    const followupNote = await this.addNote(
      caseId,
      createdBy,
      'staff',
      {
        content: `FOLLOWUP: ${dto.content}${dto.followupDate ? ` | Scheduled: ${dto.followupDate}` : ''}`,
        noteType: 'clinical',
        isVisibleToPatient: true,
      },
    );

    return {
      id: followupNote.id,
      caseId: medicalCase.id,
      content: dto.content,
      followupDate: dto.followupDate,
      status: dto.status || 'pending',
      createdBy,
      createdAt: followupNote.createdAt,
    };
  }

  /**
   * Get complete timeline of case events
   */
  async getCaseTimeline(caseId: string) {
    const medicalCase = await this.getCase(caseId);
    const notes = await this.getNotes(caseId);
    const triages = await this.getTriageHistory(caseId);

    // Combine all events into a timeline
    const timeline: any[] = [];

    // Add case creation
    timeline.push({
      type: 'case_created',
      timestamp: medicalCase.createdAt,
      data: {
        caseNumber: medicalCase.caseNumber,
        chiefComplaint: medicalCase.chiefComplaint,
        severity: medicalCase.severity,
      },
    });

    // Add all notes
    notes.forEach((note) => {
      timeline.push({
        type: 'note_added',
        timestamp: note.createdAt,
        data: {
          content: note.content,
          noteType: note.noteType,
          authorType: note.authorType,
        },
      });
    });

    // Add all triage assessments
    triages.forEach((triage) => {
      timeline.push({
        type: 'triage_assessed',
        timestamp: triage.assessedAt,
        data: {
          esiLevel: triage.esiLevel,
          assessmentNotes: triage.assessmentNotes,
        },
      });
    });

    // Add case closure if closed
    if (medicalCase.closedAt) {
      timeline.push({
        type: 'case_closed',
        timestamp: medicalCase.closedAt,
        data: {
          status: medicalCase.status,
        },
      });
    }

    // Sort by timestamp descending
    timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      caseId: medicalCase.id,
      caseNumber: medicalCase.caseNumber,
      timeline,
    };
  }
}
