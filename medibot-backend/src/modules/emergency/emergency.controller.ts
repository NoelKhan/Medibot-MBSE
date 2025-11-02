import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmergencyService } from './emergency.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEmergencyDto, UpdateEmergencyDto } from './dto/emergency.dto';

@ApiTags('emergency')
@Controller('emergency')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post()
  @ApiOperation({ summary: 'Create emergency call' })
  createEmergency(@Body() createDto: CreateEmergencyDto) {
    return this.emergencyService.createEmergency(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all emergencies' })
  getEmergencies(@Query('userId') userId?: string) {
    return this.emergencyService.getEmergencies(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get emergency by ID' })
  getEmergency(@Param('id') id: string) {
    return this.emergencyService.getEmergency(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update emergency status' })
  updateEmergency(@Param('id') id: string, @Body() updateDto: UpdateEmergencyDto) {
    return this.emergencyService.updateEmergency(id, updateDto);
  }

  @Patch(':id/assign/:staffId')
  @ApiOperation({ summary: 'Assign staff to emergency' })
  assignStaff(@Param('id') id: string, @Param('staffId') staffId: string) {
    return this.emergencyService.assignStaff(id, staffId);
  }
}
