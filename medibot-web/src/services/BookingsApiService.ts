/**
 * Bookings API Service
 * ====================
 * API wrapper for appointment and doctor booking endpoints
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api.config';
import type { Doctor, Appointment } from '../types/Booking';

export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  scheduledTime: string; // ISO 8601 date-time
  appointmentType: 'in-person' | 'telehealth';
  reason?: string;
}

export interface UpdateAppointmentRequest {
  status?: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  scheduledTime?: string;
  notes?: string;
}

export interface QueryDoctorsRequest {
  specialization?: string;
  availability?: boolean;
}

export class BookingsApiService {
  private static instance: BookingsApiService;

  private constructor() {}

  public static getInstance(): BookingsApiService {
    if (!BookingsApiService.instance) {
      BookingsApiService.instance = new BookingsApiService();
    }
    return BookingsApiService.instance;
  }

  /**
   * Get available doctors
   */
  public async getDoctors(query?: QueryDoctorsRequest): Promise<Doctor[]> {
    const params = new URLSearchParams();
    
    if (query?.specialization) {
      params.append('specialization', query.specialization);
    }
    
    if (query?.availability !== undefined) {
      params.append('availability', query.availability.toString());
    }

    const url = query 
      ? `${API_ENDPOINTS.BOOKINGS.DOCTORS}?${params.toString()}`
      : API_ENDPOINTS.BOOKINGS.DOCTORS;

    return apiClient.get<Doctor[]>(url);
  }

  /**
   * Create appointment
   */
  public async createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
    return apiClient.post<Appointment>(
      API_ENDPOINTS.BOOKINGS.APPOINTMENTS,
      data
    );
  }

  /**
   * Get appointments
   */
  public async getAppointments(patientId?: string, doctorId?: string): Promise<Appointment[]> {
    const params = new URLSearchParams();
    
    if (patientId) {
      params.append('patientId', patientId);
    }
    
    if (doctorId) {
      params.append('doctorId', doctorId);
    }

    const url = params.toString()
      ? `${API_ENDPOINTS.BOOKINGS.APPOINTMENTS}?${params.toString()}`
      : API_ENDPOINTS.BOOKINGS.APPOINTMENTS;

    return apiClient.get<Appointment[]>(url);
  }

  /**
   * Get appointment by ID
   */
  public async getAppointment(appointmentId: string): Promise<Appointment> {
    return apiClient.get<Appointment>(
      API_ENDPOINTS.BOOKINGS.APPOINTMENT(appointmentId)
    );
  }

  /**
   * Update appointment
   */
  public async updateAppointment(
    appointmentId: string,
    data: UpdateAppointmentRequest
  ): Promise<Appointment> {
    return apiClient.patch<Appointment>(
      API_ENDPOINTS.BOOKINGS.APPOINTMENT(appointmentId),
      data
    );
  }

  /**
   * Cancel appointment
   */
  public async cancelAppointment(appointmentId: string): Promise<Appointment> {
    return apiClient.delete<Appointment>(
      API_ENDPOINTS.BOOKINGS.APPOINTMENT(appointmentId)
    );
  }
}

export const bookingsApiService = BookingsApiService.getInstance();
