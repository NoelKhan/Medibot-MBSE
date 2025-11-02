/**
 * Reminders API
 * ==============
 * Pure API calls to medication reminder endpoints
 * No business logic - just HTTP calls
 */

import httpClient from './client';

// Request Types
export interface MedicationReminder {
  id: string;
  userId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  scheduledTimes: string[]; // Array of time strings like ["08:00", "20:00"]
  startDate: string;
  endDate?: string;
  enabled: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderRequest {
  userId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  scheduledTimes: string[];
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface UpdateReminderRequest {
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  scheduledTimes?: string[];
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
  notes?: string;
}

export interface ReminderLog {
  id: string;
  reminderId: string;
  scheduledTime: string;
  takenAt?: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  notes?: string;
  createdAt: string;
}

/**
 * Get reminders for user
 */
export async function getReminders(userId: string): Promise<MedicationReminder[]> {
  return httpClient.get<MedicationReminder[]>(`/api/reminders?userId=${userId}`);
}

/**
 * Get single reminder
 */
export async function getReminder(reminderId: string): Promise<MedicationReminder> {
  return httpClient.get<MedicationReminder>(`/api/reminders/${reminderId}`);
}

/**
 * Create reminder
 */
export async function createReminder(data: CreateReminderRequest): Promise<MedicationReminder> {
  return httpClient.post<MedicationReminder>('/api/reminders', data);
}

/**
 * Update reminder
 */
export async function updateReminder(
  reminderId: string,
  data: UpdateReminderRequest
): Promise<MedicationReminder> {
  return httpClient.patch<MedicationReminder>(`/api/reminders/${reminderId}`, data);
}

/**
 * Delete reminder
 */
export async function deleteReminder(reminderId: string): Promise<void> {
  return httpClient.delete<void>(`/api/reminders/${reminderId}`);
}

/**
 * Toggle reminder enabled status
 */
export async function toggleReminder(reminderId: string): Promise<MedicationReminder> {
  return httpClient.patch<MedicationReminder>(`/api/reminders/${reminderId}/toggle`);
}

/**
 * Get reminder logs (history)
 */
export async function getReminderLogs(reminderId: string): Promise<ReminderLog[]> {
  return httpClient.get<ReminderLog[]>(`/api/reminders/${reminderId}/logs`);
}

/**
 * Log medication taken
 */
export async function logMedicationTaken(reminderId: string, notes?: string): Promise<ReminderLog> {
  return httpClient.post<ReminderLog>(`/api/reminders/${reminderId}/log-taken`, { notes });
}

/**
 * Log medication skipped
 */
export async function logMedicationSkipped(reminderId: string, notes?: string): Promise<ReminderLog> {
  return httpClient.post<ReminderLog>(`/api/reminders/${reminderId}/log-skipped`, { notes });
}

// Export as object for convenience
export const remindersApi = {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
  getReminderLogs,
  logMedicationTaken,
  logMedicationSkipped,
};
