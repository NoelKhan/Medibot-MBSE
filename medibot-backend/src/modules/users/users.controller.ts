import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UpdateUserDto,
  UpdateProfileDto,
  AddMedicalHistoryDto,
  AddMedicationDto,
  AddAllergyDto,
} from './dto/user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile' })
  getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile' })
  updateUser(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateDto);
  }

  @Patch(':id/profile')
  @ApiOperation({ summary: 'Update patient profile' })
  updateProfile(@Param('id') id: string, @Body() updateDto: UpdateProfileDto) {
    return this.usersService.updateProfile(id, updateDto);
  }

  @Post(':id/medical-history')
  @ApiOperation({ summary: 'Add medical history' })
  addMedicalHistory(@Param('id') id: string, @Body() dto: AddMedicalHistoryDto) {
    return this.usersService.addMedicalHistory(id, dto);
  }

  @Get(':id/medical-history')
  @ApiOperation({ summary: 'Get medical history' })
  getMedicalHistory(@Param('id') id: string) {
    return this.usersService.getMedicalHistory(id);
  }

  @Post(':id/medications')
  @ApiOperation({ summary: 'Add medication' })
  addMedication(@Param('id') id: string, @Body() dto: AddMedicationDto) {
    return this.usersService.addMedication(id, dto);
  }

  @Get(':id/medications')
  @ApiOperation({ summary: 'Get medications' })
  getMedications(@Param('id') id: string) {
    return this.usersService.getMedications(id);
  }

  @Post(':id/allergies')
  @ApiOperation({ summary: 'Add allergy' })
  addAllergy(@Param('id') id: string, @Body() dto: AddAllergyDto) {
    return this.usersService.addAllergy(id, dto);
  }

  @Get(':id/allergies')
  @ApiOperation({ summary: 'Get allergies' })
  getAllergies(@Param('id') id: string) {
    return this.usersService.getAllergies(id);
  }
}
