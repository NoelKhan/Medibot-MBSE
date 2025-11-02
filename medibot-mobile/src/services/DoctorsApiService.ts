/**
 * Doctors API Service
 * ===================
 * Handles all API calls related to doctors, schedules, and availability
 */

import { API_CONFIG } from '../config/api.config';
import { createLogger } from './Logger';

const logger = createLogger('DoctorsApiService');

export interface DoctorProfile {
  id: string;
  fullName: string;
  specialty: string;
  bio: string | null;
  yearsOfExperience: number;
  education: string | null;
  certifications: string | null;
  languages: string[];
  status: 'active' | 'inactive' | 'on_leave';
  rating: number;
  totalReviews: number;
  consultationFee: number;
  consultationDuration: number;
  profileImageUrl: string | null;
  hospitalAffiliation: string | null;
  officeAddress: string | null;
  phoneNumber: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface DaySlots {
  date: string;
  slots: TimeSlot[];
}

export interface SearchDoctorsParams {
  specialty?: string;
  name?: string;
  minRating?: number;
  maxFee?: number;
  languages?: string[];
  page?: number;
  limit?: number;
}

export interface SearchDoctorsResponse {
  doctors: DoctorProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class DoctorsApiService {
  private static instance: DoctorsApiService;
  private token: string | null = null;
  private baseURL: string = API_CONFIG.baseURL;

  private constructor() {}

  public static getInstance(): DoctorsApiService {
    if (!DoctorsApiService.instance) {
      DoctorsApiService.instance = new DoctorsApiService();
    }
    return DoctorsApiService.instance;
  }

  /**
   * Set authentication token
   */
  public setToken(token: string): void {
    this.token = token;
  }

  /**
   * Clear authentication token
   */
  public clearToken(): void {
    this.token = null;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add custom headers from options
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Request failed',
      }));
      logger.error('API request failed', {
        endpoint,
        status: response.status,
        error,
      });
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  /**
   * Search for doctors with filters
   */
  public async searchDoctors(
    params: SearchDoctorsParams = {},
  ): Promise<SearchDoctorsResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params.specialty) queryParams.append('specialty', params.specialty);
      if (params.name) queryParams.append('name', params.name);
      if (params.minRating !== undefined)
        queryParams.append('minRating', params.minRating.toString());
      if (params.maxFee !== undefined)
        queryParams.append('maxFee', params.maxFee.toString());
      if (params.languages && params.languages.length > 0) {
        params.languages.forEach((lang) =>
          queryParams.append('languages', lang),
        );
      }
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = `/doctors/search${queryString ? `?${queryString}` : ''}`;

      logger.info('Searching doctors', { params });

      const response = await this.request<SearchDoctorsResponse>(endpoint, {
        method: 'GET',
      });

      logger.info('Doctors search successful', {
        count: response.doctors.length,
        total: response.pagination.total,
      });

      return response;
    } catch (error) {
      logger.error('Failed to search doctors', {
        error,
        params,
      });
      throw error;
    }
  }

  /**
   * Get all available specialties
   */
  public async getSpecialties(): Promise<string[]> {
    try {
      logger.info('Fetching specialties');

      const response = await this.request<string[]>('/doctors/specialties', {
        method: 'GET',
      });

      logger.info('Fetched specialties', {
        count: response.length,
      });

      return response;
    } catch (error) {
      logger.error('Failed to fetch specialties', {
        error,
      });
      throw error;
    }
  }

  /**
   * Get doctor details by ID
   */
  public async getDoctorById(doctorId: string): Promise<DoctorProfile> {
    try {
      logger.info('Fetching doctor details', {
        doctorId,
      });

      const response = await this.request<DoctorProfile>(
        `/doctors/${doctorId}`,
        {
          method: 'GET',
        },
      );

      logger.info('Fetched doctor details', {
        doctorId,
        name: response.fullName,
      });

      return response;
    } catch (error) {
      logger.error('Failed to fetch doctor', {
        error,
        doctorId,
      });
      throw error;
    }
  }

  /**
   * Get available time slots for a doctor
   */
  public async getAvailableSlots(
    doctorId: string,
    startDate: string,
    endDate: string,
  ): Promise<DaySlots[]> {
    try {
      logger.info('Fetching available slots', {
        doctorId,
        startDate,
        endDate,
      });

      const queryParams = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await this.request<DaySlots[]>(
        `/doctors/${doctorId}/availability?${queryParams.toString()}`,
        {
          method: 'GET',
        },
      );

      logger.info('Fetched available slots', {
        doctorId,
        daysCount: response.length,
      });

      return response;
    } catch (error) {
      logger.error('Failed to fetch available slots', {
        error,
        doctorId,
        startDate,
        endDate,
      });
      throw error;
    }
  }

  /**
   * Get doctors by specialty (convenience method)
   */
  public async getDoctorsBySpecialty(
    specialty: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchDoctorsResponse> {
    return this.searchDoctors({ specialty, page, limit });
  }

  /**
   * Get top-rated doctors (convenience method)
   */
  public async getTopRatedDoctors(
    limit: number = 10,
  ): Promise<SearchDoctorsResponse> {
    return this.searchDoctors({ minRating: 4.5, page: 1, limit });
  }
}

// Export singleton instance
const doctorsApiService = DoctorsApiService.getInstance();
export default doctorsApiService;
