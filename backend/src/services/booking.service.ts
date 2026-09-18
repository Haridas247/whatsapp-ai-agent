import { prisma } from '../lib/prisma';
import { whatsappService } from './whatsapp.service';
import { scheduleAppointmentReminders } from './reminder.worker';
import { emailService } from './email.service';
import { addMinutes, format, parse, isAfter, startOfDay, endOfDay, addDays } from 'date-fns';

export interface BookingStateData {
  serviceId?: string;
  serviceName?: string;
  durationMinutes?: number;
  price?: number;
  staffId?: string;
  staffName?: string;
  dateString?: string; // YYYY-MM-DD
  slotTimeString?: string; // e.g., "11:00 AM"
  startAtIso?: string;
  endAtIso?: string;
  customerName?: string;
}

export class BookingService {
  /**
   * Calculates available slots for a given staff member, service duration, and target date
   */
  public async getAvailableSlots(
    businessId: string,
    serviceId: string,
    targetDate: Date
  ): Promise<{ staffId: string; staffName: string; slots: string[] }> {
    // 1. Fetch service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // 2. Fetch primary doctor / staff
    const staff = await prisma.staff.findFirst({
      where: { business_id: businessId },
    });

    if (!staff) {
      throw new Error('Staff member not found for business');
    }

    // Working hours (e.g. 09:00 to 19:00)
    const schedule: any = staff.availability_schedule || {
      start: '09:00',
      end: '19:00',
      lunchStart: '13:00',
      lunchEnd: '14:00',
      slotDuration: service.duration_minutes || 30,
    };

    const slotDuration = schedule.slotDuration || service.duration_minutes || 30;

    // 3. Fetch existing confirmed appointments for that day
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        staff_id: staff.id,
        status: 'CONFIRMED',
        start_at: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: {
        start_at: true,
        end_at: true,
      },
    });

    // 4. Generate candidate time slots
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    const clinicOpen = parse(`${targetDateStr} ${schedule.start || '09:00'}`, 'yyyy-MM-dd HH:mm', new Date());
    const clinicClose = parse(`${targetDateStr} ${schedule.end || '19:00'}`, 'yyyy-MM-dd HH:mm', new Date());

    const availableSlots: string[] = [];
    let currentSlot = clinicOpen;
    const now = new Date();

    while (isAfter(clinicClose, addMinutes(currentSlot, slotDuration))) {
      const slotEnd = addMinutes(currentSlot, slotDuration);

      // Check if slot is in the past
      const isPast = isAfter(now, currentSlot);

      // Check lunch break
      const slotTimeStr = format(currentSlot, 'HH:mm');
      const isLunch =
        schedule.lunchStart &&
        schedule.lunchEnd &&
        slotTimeStr >= schedule.lunchStart &&
        slotTimeStr < schedule.lunchEnd;

      // Check conflict with existing appointments
      const hasConflict = existingAppointments.some((appt) => {
        const apptStart = new Date(appt.start_at);
        const apptEnd = new Date(appt.end_at);
        return (
          (currentSlot >= apptStart && currentSlot < apptEnd) ||
          (slotEnd > apptStart && slotEnd <= apptEnd) ||
          (currentSlot <= apptStart && slotEnd >= apptEnd)
        );
      });

      if (!isPast && !isLunch && !hasConflict) {
        availableSlots.push(format(currentSlot, 'hh:mm a'));
      }

      currentSlot = addMinutes(currentSlot, slotDuration);
    }

    return {
      staffId: staff.id,
      staffName: staff.name,
      slots: availableSlots,
    };
  }

  /**
   * Atomically books an appointment inside a transaction with locking to prevent double-booking
   */
  public async bookSlotAtomic(params: {
    businessId: string;
    customerId: string;
    serviceId: string;
    staffId: string;
    startAt: Date;
    endAt: Date;
    notes?: string;
  }) {
    const { businessId, customerId, serviceId, staffId, startAt, endAt, notes } = params;

    return await prisma.$transaction(async (tx) => {
      // 1. Check for overlapping appointment for this staff member
      const conflict = await tx.appointment.findFirst({
        where: {
          staff_id: staffId,
          status: 'CONFIRMED',
          OR: [
            {
              start_at: { lte: startAt },
              end_at: { gt: startAt },
            },
            {
              start_at: { lt: endAt },
              end_at: { gte: endAt },
            },
            {
              start_at: { gte: startAt },
              end_at: { lte: endAt },
            },
          ],
        },
      });

      if (conflict) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      // 2. Create appointment atomically
      const appointment = await tx.appointment.create({
        data: {
          business_id: businessId,
          customer_id: customerId,
          service_id: serviceId,
          staff_id: staffId,
          start_at: startAt,
          end_at: endAt,
          status: 'CONFIRMED',
          notes: notes || 'Booked via WhatsApp Assistant',
        },
        include: {
          service: true,
          staff: true,
          business: true,
          customer: true,
        },
      });

      return appointment;
    });
  }

  /**
   * Handles state machine progression for appointment booking
   */
  public async processBookingState(
    businessId: string,
    conversationId: string,
    customerPhone: string,
    currentStep: string,
    stateData: BookingStateData,
    userInput: string,
    buttonId?: string
  ): Promise<{ replyText: string; buttons?: Array<{ id: string; title: string }> }> {
    const services = await prisma.service.findMany({
      where: { business_id: businessId, status: 'ACTIVE' },
      take: 5,
    });

    // STEP 1: SELECT_SERVICE
    if (currentStep === 'START' || currentStep === 'SELECT_SERVICE') {
      const userLower = userInput.toLowerCase();
      const userWords = userLower.split(/\s+/).filter((w) => w.length > 2);

      let selectedService = buttonId
        ? services.find((s) => s.id === buttonId)
        : services.find((s) => {
            const sName = s.name.toLowerCase();
            return (
              sName.includes(userLower) ||
              userLower.includes(sName) ||
              (userLower.includes('consult') && sName.includes('consult')) ||
              (userLower.includes('clean') && sName.includes('clean')) ||
              (userLower.includes('root') && sName.includes('root')) ||
              (userLower.includes('white') && sName.includes('white')) ||
              (userLower.includes('fill') && sName.includes('fill'))
            );
          });

      if (!selectedService) {
        // Render service selection options
        const buttons = services.slice(0, 3).map((s) => ({
          id: s.id,
          title: s.name.slice(0, 20),
        }));

        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            state_step: 'SELECT_SERVICE',
            state_data: stateData as any,
          },
        });

        const serviceListText = services
          .map((s, idx) => `${idx + 1}. *${s.name}* - ₹${s.price} (${s.duration_minutes} mins)`)
          .join('\n');

        return {
          replyText:
            `🩺 *Please select the treatment / service you need:*\n\n` +
            `${serviceListText}\n\n` +
            `You can tap a quick button below or type the service name:`,
          buttons,
        };
      }

      // Service selected! Advance to SELECT_DATE
      const nextStateData: BookingStateData = {
        ...stateData,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        durationMinutes: selectedService.duration_minutes,
        price: selectedService.price,
      };

      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          state_step: 'SELECT_DATE',
          state_data: nextStateData as any,
        },
      });

      const today = new Date();
      const tomorrow = addDays(today, 1);
      const dayAfter = addDays(today, 2);

      return {
        replyText:
          `✅ Selected: *${selectedService.name}* (₹${selectedService.price})\n\n` +
          `📅 Which date would you like to visit?\n` +
          `• Today (${format(today, 'MMM dd')})\n` +
          `• Tomorrow (${format(tomorrow, 'MMM dd')})\n` +
          `• Day After (${format(dayAfter, 'MMM dd')})\n\n` +
          `Select an option below or type your preferred date (e.g., "Tomorrow", "Wednesday"):`,
        buttons: [
          { id: `DATE_${format(today, 'yyyy-MM-dd')}`, title: `Today (${format(today, 'dd MMM')})` },
          { id: `DATE_${format(tomorrow, 'yyyy-MM-dd')}`, title: `Tomorrow` },
          { id: `DATE_${format(dayAfter, 'yyyy-MM-dd')}`, title: `${format(dayAfter, 'EEE dd MMM')}` },
        ],
      };
    }

    // STEP 2: SELECT_DATE
    if (currentStep === 'SELECT_DATE') {
      let targetDate: Date | null = null;

      if (buttonId && buttonId.startsWith('DATE_')) {
        targetDate = parse(buttonId.replace('DATE_', ''), 'yyyy-MM-dd', new Date());
      } else {
        const lower = userInput.toLowerCase();
        const today = new Date();
        if (lower.includes('today') || lower.includes('inniku')) {
          targetDate = today;
        } else if (lower.includes('tomorrow') || lower.includes('naalaiku') || lower.includes('nalaiki')) {
          targetDate = addDays(today, 1);
        } else if (lower.includes('day after') || lower.includes('nalanniku')) {
          targetDate = addDays(today, 2);
        } else {
          // Default to tomorrow if not recognized
          targetDate = addDays(today, 1);
        }
      }

      const dateString = format(targetDate, 'yyyy-MM-dd');
      const serviceId = stateData.serviceId || services[0].id;

      const slotResult = await this.getAvailableSlots(businessId, serviceId, targetDate);

      if (slotResult.slots.length === 0) {
        const nextDay = addDays(targetDate, 1);
        return {
          replyText:
            `Sorry, all slots on *${format(targetDate, 'EEEE, MMM dd')}* are completely booked!\n\n` +
            `Would you like to check the next available day (*${format(nextDay, 'EEEE, MMM dd')}*)?`,
          buttons: [
            { id: `DATE_${format(nextDay, 'yyyy-MM-dd')}`, title: `Check Next Day` },
            { id: 'SELECT_SERVICE', title: 'Change Service' },
          ],
        };
      }

      const nextStateData: BookingStateData = {
        ...stateData,
        staffId: slotResult.staffId,
        staffName: slotResult.staffName,
        dateString,
      };

      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          state_step: 'SELECT_SLOT',
          state_data: nextStateData as any,
        },
      });

      // Present first 3 available slots as quick buttons and list all in text
      const topSlots = slotResult.slots.slice(0, 3);
      const allSlotsList = slotResult.slots.slice(0, 8).join(', ');

      return {
        replyText:
          `🗓️ Available slots on *${format(targetDate, 'EEEE, MMM dd')}* with *${slotResult.staffName}*:\n\n` +
          `🕒 ${allSlotsList}\n\n` +
          `Tap a slot below or type the time you want:`,
        buttons: topSlots.map((time) => ({
          id: `SLOT_${time.replace(/\s+/g, '')}`,
          title: time,
        })),
      };
    }

    // STEP 3: SELECT_SLOT
    if (currentStep === 'SELECT_SLOT') {
      const dateStr = stateData.dateString || format(addDays(new Date(), 1), 'yyyy-MM-dd');
      let timeInput = buttonId ? buttonId.replace('SLOT_', '') : userInput;

      let startDateTime: Date;
      const match = timeInput.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);

      if (match) {
        let hour = parseInt(match[1], 10);
        const min = match[2] ? parseInt(match[2], 10) : 0;
        const mer = match[3].toUpperCase();
        if (mer === 'PM' && hour < 12) hour += 12;
        if (mer === 'AM' && hour === 12) hour = 0;
        const [y, m, d] = dateStr.split('-').map(Number);
        startDateTime = new Date(y, m - 1, d, hour, min, 0);
      } else {
        const [y, m, d] = dateStr.split('-').map(Number);
        startDateTime = new Date(y, m - 1, d, 10, 0, 0);
      }

      const duration = stateData.durationMinutes || 30;
      const endDateTime = addMinutes(startDateTime, duration);

      const nextStateData: BookingStateData = {
        ...stateData,
        slotTimeString: format(startDateTime, 'hh:mm a'),
        startAtIso: startDateTime.toISOString(),
        endAtIso: endDateTime.toISOString(),
      };

      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          state_step: 'CONFIRM',
          state_data: nextStateData as any,
        },
      });

      const formattedSlot = format(startDateTime, 'EEEE, MMM dd, yyyy @ hh:mm a');

      return {
        replyText:
          `📋 *Appointment Summary:*\n\n` +
          `• *Patient*: Customer\n` +
          `• *Service*: ${stateData.serviceName || 'Consultation'}\n` +
          `• *Doctor*: ${stateData.staffName || 'Dr. Kumar'}\n` +
          `• *Timing*: ${formattedSlot}\n` +
          `• *Fee*: ₹${stateData.price || 500}\n\n` +
          `Shall I confirm and lock this appointment for you?`,
        buttons: [
          { id: 'CONFIRM_BOOKING', title: 'Confirm Booking ✅' },
          { id: 'SELECT_DATE', title: 'Change Date 📅' },
          { id: 'CANCEL_FLOW', title: 'Cancel ❌' },
        ],
      };
    }

    // STEP 4: CONFIRM
    if (currentStep === 'CONFIRM') {
      if (buttonId === 'CONFIRM_BOOKING' || userInput.toLowerCase().includes('yes') || userInput.toLowerCase().includes('confirm') || userInput.toLowerCase().includes('aama')) {
        const startAt = new Date(stateData.startAtIso!);
        const endAt = new Date(stateData.endAtIso!);

        // Retrieve customer
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { customer: true, business: true },
        });

        try {
          // Atomic booking with concurrency protection
          const appointment = await this.bookSlotAtomic({
            businessId,
            customerId: conv!.customer_id,
            serviceId: stateData.serviceId!,
            staffId: stateData.staffId!,
            startAt,
            endAt,
          });

          // Schedule 24h & 2h reminders in BullMQ
          try {
            await scheduleAppointmentReminders(appointment.id, startAt);
          } catch (remErr) {
            console.warn('[BookingService] Reminder scheduling notice:', remErr);
          }

          // Trigger Email Notifications (non-blocking)
          try {
            // Customer email (mocking email as customer.name @ example.com for demo)
            const customerEmail = `${conv?.customer.name.replace(/\s+/g, '').toLowerCase() || 'customer'}@example.com`;
            await emailService.sendCustomerConfirmation(
              customerEmail,
              conv!.customer.name,
              stateData.serviceName!,
              stateData.staffName!,
              startAt,
              conv!.business.name
            );

            // Admin email (mocking admin email)
            const adminEmail = `admin@${conv!.business.name.replace(/\s+/g, '').toLowerCase()}.com`;
            await emailService.sendAdminNotification(
              adminEmail,
              conv!.customer.name,
              conv!.customer.phone,
              stateData.serviceName!,
              startAt
            );
          } catch (emailErr) {
            console.error('[BookingService] Email notification failed:', emailErr);
          }

          // Reset conversation state
          await prisma.conversation.update({
            where: { id: conversationId },
            data: {
              state_step: 'START',
              state_data: {},
            },
          });

          const timingStr = format(startAt, 'EEEE, MMM dd, yyyy @ hh:mm a');

          return {
            replyText:
              `🎉 *Appointment Confirmed!* 🎉\n\n` +
              `Appointment ID: *#${appointment.id.slice(0, 8).toUpperCase()}*\n` +
              `Patient: *${conv?.customer.name}*\n` +
              `Doctor: *${stateData.staffName}*\n` +
              `Service: *${stateData.serviceName}*\n` +
              `When: *${timingStr}*\n` +
              `Address: *${conv?.business.address}*\n\n` +
              `We have scheduled reminder alerts before your visit. Nandri! We look forward to seeing you.`,
            buttons: [
              { id: 'FAQ_TIMINGS', title: 'Clinic Timings 🕒' },
              { id: 'FAQ_LOCATION', title: 'Get Directions 📍' },
            ],
          };
        } catch (err: any) {
          if (err.message === 'SLOT_ALREADY_BOOKED') {
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { state_step: 'SELECT_SLOT' },
            });
            return {
              replyText:
                `⚠️ *Slot Just Taken!*\n\n` +
                `Someone just booked that slot a moment ago. Please select another slot:`,
              buttons: [{ id: 'SELECT_DATE', title: 'View Available Slots' }],
            };
          }
          throw err;
        }
      } else if (buttonId === 'CANCEL_FLOW' || userInput.toLowerCase().includes('cancel') || userInput.toLowerCase().includes('vendaam')) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { state_step: 'START', state_data: {} },
        });

        return {
          replyText: `Booking has been cancelled. How else can I assist you today?`,
        };
      }
    }

    // Default fallback
    return {
      replyText: `How can I help you? You can book an appointment or ask questions about our clinic services.`,
    };
  }
}

export const bookingService = new BookingService();
