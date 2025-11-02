/**
 * Auth Service
 * ============
 * Handles authentication logic: registration, login, token generation
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { StaffUser } from '../../database/entities/staff-user.entity';
import { PatientProfile } from '../../database/entities/patient-profile.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateGuestDto } from './dto/create-guest.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(StaffUser)
    private staffRepository: Repository<StaffUser>,
    @InjectRepository(PatientProfile)
    private profileRepository: Repository<PatientProfile>,
    private jwtService: JwtService,
  ) {}

  /**
   * Register new patient user
   */
  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash,
      fullName: registerDto.fullName,
      dateOfBirth: registerDto.dateOfBirth
        ? new Date(registerDto.dateOfBirth)
        : null,
      phoneNumber: registerDto.phoneNumber,
      isGuest: false,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Create patient profile
    const profile = this.profileRepository.create({
      userId: savedUser.id,
      preferences: {
        notificationsEnabled: true,
        emailNotifications: true,
        smsNotifications: false,
        language: 'en',
      },
    });

    await this.profileRepository.save(profile);

    // Generate tokens
    const tokens = await this.generateTokens(savedUser.id, 'user');

    return {
      user: this.sanitizeUser(savedUser),
      ...tokens,
    };
  }

  /**
   * Login patient user
   */
  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['profile'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, 'user');

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Login staff user
   */
  async staffLogin(loginDto: LoginDto) {
    const staff = await this.staffRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!staff) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      staff.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login and status
    staff.lastLoginAt = new Date();
    staff.status = 'available';
    await this.staffRepository.save(staff);

    // Generate tokens
    const tokens = await this.generateTokens(staff.id, 'staff');

    return {
      staff: this.sanitizeStaff(staff),
      ...tokens,
    };
  }

  /**
   * Create guest user
   */
  async createGuest(createGuestDto: CreateGuestDto) {
    const guestEmail =
      createGuestDto.email || `guest_${Date.now()}@medibot.temp`;
    const guestName = createGuestDto.fullName || `Guest ${Date.now()}`;

    // Create guest user (no password)
    const user = this.userRepository.create({
      email: guestEmail,
      passwordHash: await bcrypt.hash(Math.random().toString(), 10), // Random password
      fullName: guestName,
      isGuest: true,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Create basic profile
    const profile = this.profileRepository.create({
      userId: savedUser.id,
      preferences: {
        notificationsEnabled: false,
        emailNotifications: false,
        smsNotifications: false,
        language: 'en',
      },
    });

    await this.profileRepository.save(profile);

    // Generate tokens
    const tokens = await this.generateTokens(savedUser.id, 'user');

    return {
      user: this.sanitizeUser(savedUser),
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const tokens = await this.generateTokens(payload.sub, payload.type);
      return tokens;
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Get current user by ID
   */
  async getCurrentUser(userId: string, userType: 'user' | 'staff') {
    if (userType === 'staff') {
      const staff = await this.staffRepository.findOne({
        where: { id: userId },
      });
      if (!staff) {
        throw new UnauthorizedException('Staff not found');
      }
      return { staff: this.sanitizeStaff(staff) };
    } else {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
      });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found');
      }
      return { user: this.sanitizeUser(user) };
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(userId: string, userType: 'user' | 'staff') {
    const payload = { sub: userId, type: userType };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }

  /**
   * Remove sensitive data from user
   */
  private sanitizeUser(user: User) {
    const { passwordHash: _passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Remove sensitive data from staff
   */
  private sanitizeStaff(staff: StaffUser) {
    const { passwordHash: _passwordHash, ...sanitized } = staff;
    return sanitized;
  }
}
