/**
 * Email Service
 * ==============
 * Handles all email communications including appointment confirmations,
 * reminders, password resets, and welcome emails.
 * 
 * Test email: noel5khan@gmail.com
 */

import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  appointmentDate: Date;
  appointmentType: 'immediate' | 'scheduled';
  reason?: string;
  meetingLink?: string;
}

export interface ReminderEmailData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  appointmentDate: Date;
  timeUntil: string;
  meetingLink?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly testEmail = 'noel5khan@gmail.com';

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(data: AppointmentEmailData): Promise<void> {
    try {
      const recipient = this.getRecipient(data.patientEmail);

      await this.mailerService.sendMail({
        to: recipient,
        from: 'MediBot <noreply@medibot.com>',
        subject: '✅ Appointment Confirmed - MediBot',
        html: this.getAppointmentConfirmationTemplate(data),
      });

      this.logger.log(
        `Appointment confirmation email sent to ${recipient} for ${data.patientName}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send appointment confirmation email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(data: ReminderEmailData): Promise<void> {
    try {
      const recipient = this.getRecipient(data.patientEmail);

      await this.mailerService.sendMail({
        to: recipient,
        from: 'MediBot <noreply@medibot.com>',
        subject: '⏰ Appointment Reminder - MediBot',
        html: this.getReminderTemplate(data),
      });

      this.logger.log(
        `Appointment reminder email sent to ${recipient} for ${data.patientName}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send appointment reminder email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(name: string, email: string): Promise<void> {
    try {
      const recipient = this.getRecipient(email);

      await this.mailerService.sendMail({
        to: recipient,
        from: 'MediBot <noreply@medibot.com>',
        subject: '🎉 Welcome to MediBot!',
        html: this.getWelcomeTemplate(name),
      });

      this.logger.log(`Welcome email sent to ${recipient} for ${name}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email: ${error.message}`,
        error.stack,
      );
      // Don't throw - welcome email failure shouldn't block registration
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    try {
      const recipient = this.getRecipient(email);
      const resetLink = `${this.configService.get('app.frontendUrl')}/reset-password?token=${resetToken}`;

      await this.mailerService.sendMail({
        to: recipient,
        from: 'MediBot <noreply@medibot.com>',
        subject: '🔐 Password Reset - MediBot',
        html: this.getPasswordResetTemplate(resetLink),
      });

      this.logger.log(`Password reset email sent to ${recipient}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get recipient email - use test email in development/testing
   */
  private getRecipient(originalEmail: string): string {
    const env = this.configService.get('app.env');
    
    // In production, use original email
    // In dev/test, always use test email for safety
    if (env === 'production') {
      return originalEmail;
    }
    
    this.logger.debug(
      `Using test email ${this.testEmail} instead of ${originalEmail}`,
    );
    return this.testEmail;
  }

  /**
   * Appointment Confirmation Email Template
   */
  private getAppointmentConfirmationTemplate(
    data: AppointmentEmailData,
  ): string {
    const formattedDate = new Date(data.appointmentDate).toLocaleString(
      'en-US',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Appointment Confirmed</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.patientName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your ${data.appointmentType === 'immediate' ? 'immediate consultation' : 'appointment'} has been confirmed! 
      Here are the details:
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
      <p style="margin: 10px 0;"><strong>👨‍⚕️ Doctor:</strong> ${data.doctorName}</p>
      <p style="margin: 10px 0;"><strong>📅 Date & Time:</strong> ${formattedDate}</p>
      <p style="margin: 10px 0;"><strong>📋 Type:</strong> ${data.appointmentType === 'immediate' ? 'Immediate Consultation' : 'Scheduled Appointment'}</p>
      ${data.reason ? `<p style="margin: 10px 0;"><strong>📝 Reason:</strong> ${data.reason}</p>` : ''}
    </div>
    
    ${data.meetingLink ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.meetingLink}" 
         style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; 
                border-radius: 5px; display: inline-block; font-weight: bold;">
        Join Video Call
      </a>
    </div>
    ` : ''}
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;">
        <strong>⏰ Reminder:</strong> You'll receive a reminder 1 hour before your appointment.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      If you need to reschedule or cancel, please contact us as soon as possible.
    </p>
    
    <p style="font-size: 16px; margin-top: 20px;">
      Best regards,<br>
      <strong>The MediBot Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
    <p>This email was sent to ${data.patientEmail}</p>
    <p>© 2025 MediBot. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Appointment Reminder Email Template
   */
  private getReminderTemplate(data: ReminderEmailData): string {
    const formattedDate = new Date(data.appointmentDate).toLocaleString(
      'en-US',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Appointment Reminder</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.patientName},</p>
    
    <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
      <p style="font-size: 18px; font-weight: bold; margin: 0; color: #856404;">
        Your appointment is ${data.timeUntil}!
      </p>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f5576c; margin-bottom: 20px;">
      <p style="margin: 10px 0;"><strong>👨‍⚕️ Doctor:</strong> ${data.doctorName}</p>
      <p style="margin: 10px 0;"><strong>📅 Date & Time:</strong> ${formattedDate}</p>
    </div>
    
    ${data.meetingLink ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.meetingLink}" 
         style="background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; 
                border-radius: 5px; display: inline-block; font-weight: bold;">
        Join Video Call Now
      </a>
    </div>
    ` : ''}
    
    <div style="background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #0c5460;">
        <strong>💡 Tip:</strong> Make sure you're in a quiet place with good internet connection for your video call.
      </p>
    </div>
    
    <p style="font-size: 16px; margin-top: 20px;">
      See you soon!<br>
      <strong>The MediBot Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
    <p>This email was sent to ${data.patientEmail}</p>
    <p>© 2025 MediBot. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Welcome Email Template
   */
  private getWelcomeTemplate(name: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MediBot</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Welcome to MediBot!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${name},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Thank you for joining MediBot! We're excited to have you on board. 🚀
    </p>
    
    <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0;">
      <h2 style="color: #667eea; margin-top: 0;">What can you do with MediBot?</h2>
      
      <div style="margin: 15px 0;">
        <p style="margin: 10px 0;">
          💬 <strong>Instant Chat:</strong> Get medical advice from our AI assistant 24/7
        </p>
        <p style="margin: 10px 0;">
          👨‍⚕️ <strong>Doctor Consultations:</strong> Book appointments with licensed doctors
        </p>
        <p style="margin: 10px 0;">
          🚨 <strong>Emergency Support:</strong> Quick access to emergency services
        </p>
        <p style="margin: 10px 0;">
          📋 <strong>Medical History:</strong> Track your health cases and follow-ups
        </p>
        <p style="margin: 10px 0;">
          ⏰ <strong>Smart Reminders:</strong> Never miss an appointment or medication
        </p>
      </div>
    </div>
    
    <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #155724;">
        <strong>✅ Pro Tip:</strong> Enable notifications in your profile to receive appointment reminders and health tips!
      </p>
    </div>
    
    <p style="font-size: 16px; margin-top: 30px;">
      If you have any questions, our support team is always here to help.
    </p>
    
    <p style="font-size: 16px; margin-top: 20px;">
      Stay healthy!<br>
      <strong>The MediBot Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
    <p>© 2025 MediBot. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Password Reset Email Template
   */
  private getPasswordResetTemplate(resetLink: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      We received a request to reset your password for your MediBot account.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" 
         style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; 
                border-radius: 5px; display: inline-block; font-weight: bold;">
        Reset Password
      </a>
    </div>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;">
        <strong>⚠️ Security Note:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
    </p>
    
    <p style="font-size: 16px; margin-top: 30px;">
      Best regards,<br>
      <strong>The MediBot Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
    <p>© 2025 MediBot. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  }
}
