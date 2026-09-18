import { Resend } from 'resend';

// Use a placeholder if no environment variable is provided during development
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_123');

// Default sender email (this must be verified in Resend dashboard)
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';

export class EmailService {
  /**
   * Send Booking Confirmation Email
   */
  public async sendBookingConfirmation(
    to: string,
    customerName: string,
    clinicName: string,
    serviceName: string,
    appointmentTime: string
  ) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${clinicName} <${SENDER_EMAIL}>`,
        to: [to],
        subject: 'Your Appointment is Confirmed! 🎉',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #2563eb;">Appointment Confirmed</h2>
            <p>Hi ${customerName},</p>
            <p>Your appointment at <strong>${clinicName}</strong> has been successfully booked!</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Service:</strong> ${serviceName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Time:</strong> ${appointmentTime}</p>
            </div>
            
            <p>If you need to reschedule, please reply to our WhatsApp bot.</p>
            <p>We look forward to seeing you!</p>
          </div>
        `,
      });

      if (error) console.error('[EmailService] Confirmation Error:', error);
      return { data, error };
    } catch (err) {
      console.error('[EmailService] Failed to send confirmation email', err);
    }
  }

  /**
   * Send Booking Cancellation Email
   */
  public async sendBookingCancellation(
    to: string,
    customerName: string,
    clinicName: string,
    serviceName: string,
    appointmentTime: string
  ) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${clinicName} <${SENDER_EMAIL}>`,
        to: [to],
        subject: 'Appointment Cancelled',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #ef4444;">Appointment Cancelled</h2>
            <p>Hi ${customerName},</p>
            <p>Your appointment for <strong>${serviceName}</strong> at <strong>${clinicName}</strong> on <strong>${appointmentTime}</strong> has been cancelled as requested.</p>
            <p>If you'd like to book another time, simply say "book appointment" to our WhatsApp bot!</p>
          </div>
        `,
      });

      if (error) console.error('[EmailService] Cancellation Error:', error);
      return { data, error };
    } catch (err) {
      console.error('[EmailService] Failed to send cancellation email', err);
    }
  }

  /**
   * Send Appointment Reminder Email
   */
  public async sendAppointmentReminder(
    to: string,
    customerName: string,
    clinicName: string,
    serviceName: string,
    appointmentTime: string
  ) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${clinicName} <${SENDER_EMAIL}>`,
        to: [to],
        subject: 'Reminder: Upcoming Appointment 🗓️',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #2563eb;">Appointment Reminder</h2>
            <p>Hi ${customerName},</p>
            <p>This is a friendly reminder for your upcoming appointment at <strong>${clinicName}</strong>.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Service:</strong> ${serviceName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Time:</strong> ${appointmentTime}</p>
            </div>
            
            <p>See you soon!</p>
          </div>
        `,
      });

      if (error) console.error('[EmailService] Reminder Error:', error);
      return { data, error };
    } catch (err) {
      console.error('[EmailService] Failed to send reminder email', err);
    }
  }

  /**
   * Send Human Handoff Alert to Clinic Admin
   */
  public async sendHumanHandoffAlert(
    adminEmail: string,
    customerName: string,
    clinicName: string,
    customerPhone: string
  ) {
    try {
      const { data, error } = await resend.emails.send({
        from: `AI Assistant <${SENDER_EMAIL}>`,
        to: [adminEmail],
        subject: `ACTION REQUIRED: Human Handoff requested by ${customerName} 🚨`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #eab308;">Human Handoff Alert</h2>
            <p>Hello <strong>${clinicName} Admin</strong>,</p>
            <p>A customer requires live human assistance on WhatsApp.</p>
            
            <div style="background-color: #fefce8; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #fef08a;">
              <p style="margin: 0;"><strong>Customer Name:</strong> ${customerName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Phone:</strong> ${customerPhone}</p>
            </div>
            
            <p>Please log in to your dashboard to take over the conversation.</p>
          </div>
        `,
      });

      if (error) console.error('[EmailService] Handoff Alert Error:', error);
      return { data, error };
    } catch (err) {
      console.error('[EmailService] Failed to send handoff alert email', err);
    }
  }
  
  /**
   * Send Limit Reached Notification
   */
  public async sendLimitReachedNotification(
    adminEmail: string,
    clinicName: string,
    limit: number
  ) {
    try {
      const { data, error } = await resend.emails.send({
        from: `AI Assistant <${SENDER_EMAIL}>`,
        to: [adminEmail],
        subject: `WARNING: Conversation Limit Reached 🚨`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #ef4444;">Limit Reached</h2>
            <p>Hello <strong>${clinicName} Admin</strong>,</p>
            <p>Your clinic has reached the maximum allowed monthly AI conversations limit (${limit}).</p>
            <p>Please upgrade your plan or contact support to continue using the AI assistant.</p>
          </div>
        `,
      });

      if (error) console.error('[EmailService] Limit Alert Error:', error);
      return { data, error };
    } catch (err) {
      console.error('[EmailService] Failed to send limit alert email', err);
    }
  }
}

export const emailService = new EmailService();
