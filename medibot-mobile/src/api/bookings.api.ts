/**
 * Bookings API
 * =============
 * Pure API calls to appointment and doctor booking endpoints
 * No business logic - just HTTP calls
 */

import httpClient from './client';
import { Doctor, Appointment } from '../types/Booking';

// Request Types
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

/**
 * Get available doctors
 */
export async function getDoctors(query?: QueryDoctorsRequest): Promise<Doctor[]> {
  const params = new URLSearchParams();
  
  if (query?.specialization) {
    params.append('specialization', query.specialization);
  }
  
  if (query?.availability !== undefined) {
    params.append('availability', query.availability.toString());
  }

  const url = query 
    ? `/api/bookings/doctors?${params.toString()}`
    : '/api/bookings/doctors';

  return httpClient.get<Doctor[]>(url);
}

/**
 * Create appointment
 */
export async function createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
  return httpClient.post<Appointment>('/api/bookings/appointments', data);
}

/**
 * Get appointments
 */
export async function getAppointments(patientId?: string, doctorId?: string): Promise<Appointment[]> {
  const params = new URLSearchParams();
  
  if (patientId) {
    params.append('patientId', patientId);
  }
  
  if (doctorId) {
    params.append('doctorId', doctorId);
  }

  const url = params.toString()
    ? `/api/bookings/appointments?${params.toString()}`
    : '/api/bookings/appointments';

  return httpClient.get<Appointment[]>(url);
}

/**
 * Get appointment by ID
 */
export async function getAppointment(appointmentId: string): Promise<Appointment> {
  return httpClient.get<Appointment>(`/api/bookings/appointments/${appointmentId}`);
}

/**
 * Update appointment
 */
export async function updateAppointment(
  appointmentId: string,
  data: UpdateAppointmentRequest
): Promise<Appointment> {
  return httpClient.patch<Appointment>(`/api/bookings/appointments/${appointmentId}`, data);
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  return httpClient.delete<Appointment>(`/api/bookings/appointments/${appointmentId}`);
}

// Export as object for convenience
export const bookingsApi = {
  getDoctors,
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  cancelAppointment,
};
