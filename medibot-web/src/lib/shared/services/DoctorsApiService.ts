/**
 * Doctors API Service
 * ===================
 * Platform-agnostic doctors and scheduling service
 */

import type { HttpClient } from '../utils/httpClient';
import type {
  DoctorProfile,
  DaySlots,
  SearchDoctorsParams,
  SearchDoctorsResponse,
  DoctorSpecialty,
} from '../types';

export class DoctorsApiService {
  private httpClient: HttpClient;
  private baseEndpoint = '/doctors';

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Search for doctors with filters
   */
  async searchDoctors(params: SearchDoctorsParams = {}): Promise<SearchDoctorsResponse> {
    const queryParts: string[] = [];
    
    if (params.specialty) queryParts.push(`specialty=${encodeURIComponent(params.specialty)}`);
    if (params.name) queryParts.push(`name=${encodeURIComponent(params.name)}`);
    if (params.minRating !== undefined) queryParts.push(`minRating=${params.minRating}`);
    if (params.maxFee !== undefined) queryParts.push(`maxFee=${params.maxFee}`);
    if (params.languages?.length) queryParts.push(`languages=${params.languages.map(encodeURIComponent).join(',')}`);
    if (params.page !== undefined) queryParts.push(`page=${params.page}`);
    if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const url = `${this.baseEndpoint}/search${queryString}`;
    const response = await this.httpClient.get<SearchDoctorsResponse>(url);
    
    return {
      ...response.data,
      doctors: response.data.doctors.map(doc => this.deserializeDoctor(doc)),
    };
  }

  /**
   * Get all available specialties
   */
  async getSpecialties(): Promise<DoctorSpecialty[]> {
    const response = await this.httpClient.get<DoctorSpecialty[]>(
      `${this.baseEndpoint}/specialties`
    );
    return response.data;
  }

  /**
   * Get doctor by ID
   */
  async getDoctorById(doctorId: string): Promise<DoctorProfile> {
    const response = await this.httpClient.get<DoctorProfile>(
      `${this.baseEndpoint}/${doctorId}`
    );
    return this.deserializeDoctor(response.data);
  }

  /**
   * Get available time slots for a doctor
   */
  async getAvailableSlots(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Promise<DaySlots[]> {
    const response = await this.httpClient.get<DaySlots[]>(
      `${this.baseEndpoint}/${doctorId}/availability?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  }

  /**
   * Get doctors by specialty
   */
  async getDoctorsBySpecialty(
    specialty: string,
    limit: number = 10
  ): Promise<DoctorProfile[]> {
    const response = await this.searchDoctors({ specialty, limit });
    return response.doctors;
  }

  /**
   * Get top-rated doctors
   */
  async getTopRatedDoctors(limit: number = 10): Promise<DoctorProfile[]> {
    const response = await this.searchDoctors({ minRating: 4.0, limit });
    return response.doctors;
  }

  /**
   * Get doctors with specific languages
   */
  async getDoctorsByLanguages(
    languages: string[],
    limit: number = 10
  ): Promise<DoctorProfile[]> {
    const response = await this.searchDoctors({ languages, limit });
    return response.doctors;
  }

  // Helper method to deserialize dates from JSON strings
  private deserializeDoctor(doctor: any): DoctorProfile {
    return {
      ...doctor,
      createdAt: new Date(doctor.createdAt),
      updatedAt: new Date(doctor.updatedAt),
    };
  }
}
