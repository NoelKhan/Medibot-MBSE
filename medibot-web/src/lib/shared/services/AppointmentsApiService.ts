/**
 * Appointments API Service
 * =========================
 * Platform-agnostic appointments management service
 */

import type { HttpClient } from '../utils/httpClient';
import type {
  Appointment,
  CreateAppointmentRequest,
} from '../types';

export class AppointmentsApiService {
  private httpClient: HttpClient;
  private baseEndpoint = '/appointments';

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Get all appointments for the current user
   */
  async getAppointments(status?: string): Promise<Appointment[]> {
    const url = status 
      ? `${this.baseEndpoint}?status=${status}`
      : this.baseEndpoint;
    
    const response = await this.httpClient.get<Appointment[]>(url);
    return response.data.map(apt => this.deserializeAppointment(apt));
  }

  /**
   * Get a specific appointment by ID
   */
  async getAppointmentById(appointmentId: string): Promise<Appointment> {
    const response = await this.httpClient.get<Appointment>(
      `${this.baseEndpoint}/${appointmentId}`
    );
    return this.deserializeAppointment(response.data);
  }

  /**
   * Create a new appointment
   */
  async createAppointment(request: CreateAppointmentRequest): Promise<Appointment> {
    const response = await this.httpClient.post<Appointment>(
      this.baseEndpoint,
      request
    );
    return this.deserializeAppointment(response.data);
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string): Promise<Appointment> {
    const response = await this.httpClient.patch<Appointment>(
      `${this.baseEndpoint}/${appointmentId}`,
      { status: 'cancelled' }
    );
    return this.deserializeAppointment(response.data);
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    newScheduledAt: string
  ): Promise<Appointment> {
    const response = await this.httpClient.patch<Appointment>(
      `${this.baseEndpoint}/${appointmentId}`,
      { scheduledAt: newScheduledAt }
    );
    return this.deserializeAppointment(response.data);
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(): Promise<Appointment[]> {
    const response = await this.httpClient.get<Appointment[]>(
      `${this.baseEndpoint}?status=scheduled,confirmed`
    );
    return response.data.map(apt => this.deserializeAppointment(apt));
  }

  /**
   * Get past appointments
   */
  async getPastAppointments(): Promise<Appointment[]> {
    const response = await this.httpClient.get<Appointment[]>(
      `${this.baseEndpoint}?status=completed,cancelled,no_show`
    );
    return response.data.map(apt => this.deserializeAppointment(apt));
  }

  // Helper method to deserialize dates from JSON strings
  private deserializeAppointment(appointment: any): Appointment {
    return {
      ...appointment,
      scheduledAt: new Date(appointment.scheduledAt),
      createdAt: new Date(appointment.createdAt),
      updatedAt: new Date(appointment.updatedAt),
      doctor: appointment.doctor ? {
        ...appointment.doctor,
        createdAt: new Date(appointment.doctor.createdAt),
        updatedAt: new Date(appointment.doctor.updatedAt),
      } : undefined,
    };
  }
}
