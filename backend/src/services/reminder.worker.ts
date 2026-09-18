import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { whatsappService } from './whatsapp.service';
import { emailService } from './email.service';

export interface ReminderJobData {
  appointmentId: string;
  reminderType: 'REMINDER_24H' | 'REMINDER_2H';
  scheduledTime: string;
}

const QUEUE_NAME = 'appointment-reminders';

// BullMQ Queue instance
export const reminderQueue = new Queue<ReminderJobData>(QUEUE_NAME, {
  connection: redisConnection as any,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

/**
 * Worker to process scheduled reminder notifications
 */
export const reminderWorker = new Worker<ReminderJobData>(
  QUEUE_NAME,
  async (job: Job<ReminderJobData>) => {
    const { appointmentId, reminderType } = job.data;
    console.log(`[ReminderWorker] Processing ${reminderType} for appointment ${appointmentId}`);

    try {
      // Check appointment status in DB
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          customer: true,
          service: true,
          business: true,
          staff: true,
        },
      });

      if (!appointment) {
        console.log(`[ReminderWorker] Appointment ${appointmentId} not found, skipping.`);
        return;
      }

      if (appointment.status !== 'CONFIRMED') {
        console.log(
          `[ReminderWorker] Appointment status is ${appointment.status}, skipping reminder.`
        );
        // Mark DB reminder record as CANCELLED
        await prisma.reminder.updateMany({
          where: {
            appointment_id: appointmentId,
            reminder_type: reminderType,
            status: 'PENDING',
          },
          data: { status: 'CANCELLED' },
        });
        return;
      }

      // Format appointment timing
      const startDateTime = new Date(appointment.start_at);
      const timeString = startDateTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: appointment.business.timezone || 'Asia/Kolkata',
      });
      const dateString = startDateTime.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: appointment.business.timezone || 'Asia/Kolkata',
      });

      const leadTimeText = reminderType === 'REMINDER_24H' ? 'tomorrow' : 'in 2 hours';

      const messageText =
        `🔔 *Appointment Reminder*\n\n` +
        `Vanakkam ${appointment.customer.name}! This is a gentle reminder from *${appointment.business.name}*.\n\n` +
        `🗓️ *When*: ${dateString} at *${timeString}* (${leadTimeText})\n` +
        `🩺 *Service*: ${appointment.service.name}\n` +
        `👨‍⚕️ *Doctor*: ${appointment.staff.name}\n` +
        `📍 *Location*: ${appointment.business.address}\n\n` +
        `If you need to reschedule or need directions, reply to this message directly!`;

      // Dispatch WhatsApp message
      await whatsappService.sendTextMessage(appointment.customer.phone, messageText);

      // Dispatch Email message
      try {
        const customerEmail = `${appointment.customer.name.replace(/\s+/g, '').toLowerCase() || 'customer'}@example.com`;
        await emailService.sendAppointmentReminder(
          customerEmail,
          appointment.customer.name,
          appointment.business.name,
          appointment.service.name,
          `${dateString} at ${timeString}`
        );
      } catch (emailErr) {
        console.error('[ReminderWorker] Failed to send reminder email', emailErr);
      }

      // Update DB record
      await prisma.reminder.updateMany({
        where: {
          appointment_id: appointmentId,
          reminder_type: reminderType,
          status: 'PENDING',
        },
        data: { status: 'SENT' },
      });

      console.log(`[ReminderWorker] Successfully sent ${reminderType} to ${appointment.customer.phone}`);
    } catch (err: any) {
      console.error(`[ReminderWorker] Error sending reminder:`, err.message);
      throw err;
    }
  },
  {
    connection: redisConnection as any,
    concurrency: 5,
  }
);

reminderWorker.on('failed', (job, err) => {
  console.error(`[ReminderWorker] Job ${job?.id} failed:`, err.message);
});

/**
 * Schedules 24H and 2H reminders in both BullMQ and database
 */
export async function scheduleAppointmentReminders(appointmentId: string, startAt: Date): Promise<void> {
  const now = Date.now();
  const appointmentTime = startAt.getTime();

  // 24 Hours reminder (if appointment is at least 24.5 hours in future)
  const twentyFourHoursBefore = appointmentTime - 24 * 60 * 60 * 1000;
  if (twentyFourHoursBefore > now) {
    const delay24h = twentyFourHoursBefore - now;
    const scheduledDate = new Date(twentyFourHoursBefore);

    await prisma.reminder.create({
      data: {
        appointment_id: appointmentId,
        reminder_type: 'REMINDER_24H',
        scheduled_at: scheduledDate,
        status: 'PENDING',
      },
    });

    await reminderQueue.add(
      'send_reminder',
      {
        appointmentId,
        reminderType: 'REMINDER_24H',
        scheduledTime: scheduledDate.toISOString(),
      },
      {
        delay: delay24h,
        jobId: `rem_24h_${appointmentId}`,
      }
    );
  }

  // 2 Hours reminder (if appointment is at least 2.5 hours in future)
  const twoHoursBefore = appointmentTime - 2 * 60 * 60 * 1000;
  if (twoHoursBefore > now) {
    const delay2h = twoHoursBefore - now;
    const scheduledDate = new Date(twoHoursBefore);

    await prisma.reminder.create({
      data: {
        appointment_id: appointmentId,
        reminder_type: 'REMINDER_2H',
        scheduled_at: scheduledDate,
        status: 'PENDING',
      },
    });

    await reminderQueue.add(
      'send_reminder',
      {
        appointmentId,
        reminderType: 'REMINDER_2H',
        scheduledTime: scheduledDate.toISOString(),
      },
      {
        delay: delay2h,
        jobId: `rem_2h_${appointmentId}`,
      }
    );
  }
}
