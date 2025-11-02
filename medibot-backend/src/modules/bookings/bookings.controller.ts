import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAppointmentDto, UpdateAppointmentDto, QueryDoctorsDto } from './dto/booking.dto';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('doctors')
  @ApiOperation({ summary: 'Get available doctors' })
  getDoctors(@Query() query: QueryDoctorsDto) {
    return this.bookingsService.getDoctors(query);
  }

  @Post('appointments')
  @ApiOperation({ summary: 'Book new appointment' })
  createAppointment(@Body() createDto: CreateAppointmentDto) {
    return this.bookingsService.createAppointment(createDto);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Get appointments' })
  getAppointments(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.bookingsService.getAppointments(patientId, doctorId);
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  getAppointment(@Param('id') id: string) {
    return this.bookingsService.getAppointment(id);
  }

  @Patch('appointments/:id')
  @ApiOperation({ summary: 'Update appointment' })
  updateAppointment(@Param('id') id: string, @Body() updateDto: UpdateAppointmentDto) {
    return this.bookingsService.updateAppointment(id, updateDto);
  }

  @Delete('appointments/:id')
  @ApiOperation({ summary: 'Cancel appointment' })
  cancelAppointment(@Param('id') id: string) {
    return this.bookingsService.cancelAppointment(id);
  }
}
