import { Resend } from 'resend';
import { config } from '../config/env';
import { format } from 'date-fns';

const resend = new Resend(config.RESEND_API_KEY || 're_dummy_key'); // Fallback for dev

export class EmailService {
  /**
   * Sends an email notification to the customer about their appointment
   */
  public async sendCustomerConfirmation(
    customerEmail: string,
    customerName: string,
    serviceName: string,
    staffName: string,
    startAt: Date,
    businessName: string
  ) {
    if (!config.RESEND_API_KEY) {
      console.log(`[Email Mock] Sent to ${customerEmail}: Appointment Confirmed!`);
      return;
    }

    try {
      await resend.emails.send({
        from: 'bookings@bizentrix.com', // Update this to a verified domain
        to: customerEmail,
        subject: `Your Appointment is Confirmed - ${businessName}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0078D4;">Appointment Confirmed!</h2>
            <p>Hi ${customerName},</p>
            <p>Your appointment has been successfully scheduled. Here are the details:</p>
            <table style="background: #f3f2f1; padding: 15px; border-radius: 5px; width: 100%;">
              <tr><td><strong>Service:</strong></td><td>${serviceName}</td></tr>
              <tr><td><strong>Doctor/Staff:</strong></td><td>${staffName}</td></tr>
              <tr><td><strong>Date & Time:</strong></td><td>${format(startAt, 'EEEE, MMM dd, yyyy @ hh:mm a')}</td></tr>
            </table>
            <p style="margin-top: 20px;">We look forward to seeing you at ${businessName}!</p>
          </div>
        `,
      });
      console.log(`[Email] Customer confirmation sent to ${customerEmail}`);
    } catch (error) {
      console.error('[Email Error] Failed to send customer email:', error);
    }
  }

  /**
   * Sends an email notification to the clinic admin about a new booking
   */
  public async sendAdminNotification(
    adminEmail: string,
    customerName: string,
    customerPhone: string,
    serviceName: string,
    startAt: Date
  ) {
    if (!config.RESEND_API_KEY) {
      console.log(`[Email Mock] Sent to Admin (${adminEmail}): New Booking by ${customerName}`);
      return;
    }

    try {
      await resend.emails.send({
        from: 'system@bizentrix.com',
        to: adminEmail,
        subject: `New Appointment Booking - ${customerName}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #107c41;">New Appointment Received</h2>
            <p>A new appointment has been booked via the WhatsApp AI Assistant.</p>
            <table style="background: #f3f2f1; padding: 15px; border-radius: 5px; width: 100%;">
              <tr><td><strong>Patient/Customer:</strong></td><td>${customerName} (${customerPhone})</td></tr>
              <tr><td><strong>Service:</strong></td><td>${serviceName}</td></tr>
              <tr><td><strong>Date & Time:</strong></td><td>${format(startAt, 'EEEE, MMM dd, yyyy @ hh:mm a')}</td></tr>
            </table>
            <p style="margin-top: 20px;">Log in to your Admin Dashboard to view more details.</p>
          </div>
        `,
      });
      console.log(`[Email] Admin notification sent to ${adminEmail}`);
    } catch (error) {
      console.error('[Email Error] Failed to send admin email:', error);
    }
  }

  /**
   * Sends an email notification to the clinic admin when they reach their chat limit
   */
  public async sendLimitReachedNotification(adminEmail: string, businessName: string, limit: number) {
    if (!config.RESEND_API_KEY) {
      console.log(`[Email Mock] Sent to Admin (${adminEmail}): Chat Limit Reached for ${businessName}`);
      return;
    }

    try {
      await resend.emails.send({
        from: 'system@bizentrix.com',
        to: adminEmail,
        subject: `⚠️ Action Required: AI Chat Limit Reached - ${businessName}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #d13438;">AI Chat Limit Reached</h2>
            <p>Your WhatsApp AI Assistant has reached its monthly chat limit of <strong>${limit}</strong> messages.</p>
            <p>The AI will no longer respond to new messages until your limit is increased or reset.</p>
            <p style="margin-top: 20px;">Please contact support to upgrade your plan.</p>
          </div>
        `,
      });
      console.log(`[Email] Limit reached notification sent to ${adminEmail}`);
    } catch (error) {
      console.error('[Email Error] Failed to send limit reached email:', error);
    }
  }
}

export const emailService = new EmailService();
