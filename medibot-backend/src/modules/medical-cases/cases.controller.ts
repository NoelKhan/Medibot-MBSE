import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalCasesService } from './cases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCaseDto, UpdateCaseDto, AddCaseNoteDto, CreateTriageDto, AssignCaseDto, CreateFollowupDto } from './dto/case.dto';

@ApiTags('cases')
@Controller('cases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MedicalCasesController {
  constructor(private readonly casesService: MedicalCasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new medical case' })
  createCase(@Body() createDto: CreateCaseDto) {
    return this.casesService.createCase(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cases' })
  getCases(@Query('patientId') patientId?: string) {
    return this.casesService.getCases(patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get case by ID' })
  getCase(@Param('id') id: string) {
    return this.casesService.getCase(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update case' })
  updateCase(@Param('id') id: string, @Body() updateDto: UpdateCaseDto) {
    return this.casesService.updateCase(id, updateDto);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add case note' })
  addNote(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: AddCaseNoteDto,
  ) {
    return this.casesService.addNote(id, user.userId, user.userType, dto);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get case notes' })
  getNotes(@Param('id') id: string) {
    return this.casesService.getNotes(id);
  }

  @Post(':id/triage')
  @ApiOperation({ summary: 'Create triage assessment' })
  createTriage(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateTriageDto,
  ) {
    return this.casesService.createTriage(id, user.userId, dto);
  }

  @Get(':id/triage')
  @ApiOperation({ summary: 'Get triage history' })
  getTriageHistory(@Param('id') id: string) {
    return this.casesService.getTriageHistory(id);
  }

  @Put(':id/assign')
  @ApiOperation({ summary: 'Assign case to staff member' })
  assignCase(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: AssignCaseDto,
  ) {
    return this.casesService.assignCase(id, dto.staffId, user.userId);
  }

  @Post(':id/followup')
  @ApiOperation({ summary: 'Create followup for case' })
  createFollowup(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateFollowupDto,
  ) {
    return this.casesService.createFollowup(id, user.userId, dto);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get case timeline (history of all events)' })
  getCaseTimeline(@Param('id') id: string) {
    return this.casesService.getCaseTimeline(id);
  }
}
