import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchDoctorsDto, GetAvailableSlotsDto } from './dto/doctors.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  /**
   * Search for doctors
   * GET /doctors/search?specialty=Cardiologist&minRating=4
   */
  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchDoctors(@Query(ValidationPipe) dto: SearchDoctorsDto) {
    return this.doctorsService.searchDoctors(dto);
  }

  /**
   * Get all specialties
   * GET /doctors/specialties
   */
  @Get('specialties')
  @UseGuards(JwtAuthGuard)
  async getSpecialties() {
    return this.doctorsService.getSpecialties();
  }

  /**
   * Get doctor by ID
   * GET /doctors/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getDoctorById(@Param('id') id: string) {
    return this.doctorsService.getDoctorById(id);
  }

  /**
   * Get available slots for a doctor
   * GET /doctors/:id/availability?startDate=2024-01-01&endDate=2024-01-07
   */
  @Get(':id/availability')
  @UseGuards(JwtAuthGuard)
  async getAvailability(
    @Param('id') doctorId: string,
    @Query(ValidationPipe) dto: GetAvailableSlotsDto,
  ) {
    return this.doctorsService.getAvailableSlots({
      ...dto,
      doctorId,
    });
  }
}
