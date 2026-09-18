import readline from 'readline';
import { prisma } from '../lib/prisma';
import { geminiService } from '../services/gemini.service';
import { ragService } from '../services/rag.service';
import { bookingService } from '../services/booking.service';
import { handoffService } from '../services/handoff.service';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const DEFAULT_PHONE = '919876543210';
let activeButtons: Array<{ id: string; title: string }> = [];

async function printBanner() {
  console.clear();
  console.log('\x1b[32m========================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m   📲 WHATSAPP BUSINESS AI RECEPTIONIST - LOCAL CLI SIMULATOR   \x1b[0m');
  console.log('\x1b[32m========================================================================\x1b[0m');
  console.log(' Clinic Pilot  : Dr. Kumar Dental Clinic (Anna Nagar, Chennai)');
  console.log(' Customer Phone: \x1b[36m' + DEFAULT_PHONE + '\x1b[0m');
  console.log(' Languages     : English, Tamil (தமிழ்), Tanglish');
  console.log(' Commands      : \x1b[33m/reset\x1b[0m (reset chat), \x1b[33m/status\x1b[0m (view state), \x1b[33m/exit\x1b[0m');
  console.log('\x1b[32m------------------------------------------------------------------------\x1b[0m\n');
}

async function simulateIncomingMessage(userText: string) {
  const business = await prisma.business.findFirst({ where: { status: 'ACTIVE' } });
  if (!business) {
    console.log('\x1b[31m[Error] No active business found. Please run npm run db:seed first.\x1b[0m');
    return;
  }

  // Find or create customer
  let customer = await prisma.customer.findUnique({
    where: {
      business_id_phone: {
        business_id: business.id,
        phone: DEFAULT_PHONE,
      },
    },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        business_id: business.id,
        phone: DEFAULT_PHONE,
        name: 'Rajesh Murugan',
      },
    });
  }

  // Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: { business_id: business.id, customer_id: customer.id },
    orderBy: { updated_at: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        business_id: business.id,
        customer_id: customer.id,
        status: 'BOT',
        state_step: 'START',
        state_data: {},
      },
    });
  }

  // Check if input was a number selecting an active interactive button
  let buttonId: string | undefined = undefined;
  const numSelection = parseInt(userText.trim(), 10);
  if (!isNaN(numSelection) && numSelection >= 1 && numSelection <= activeButtons.length) {
    buttonId = activeButtons[numSelection - 1].id;
    userText = activeButtons[numSelection - 1].title;
    console.log(`\x1b[90m[Simulated Button Click: ${buttonId} ("${userText}")]\x1b[0m\n`);
  }
  activeButtons = []; // Clear current buttons

  // Record user message
  await prisma.message.create({
    data: {
      conversation_id: conversation.id,
      sender: 'CUSTOMER',
      message: userText,
      message_type: buttonId ? 'interactive_button' : 'text',
      metadata: { buttonId },
    },
  });

  // Check if Bot is currently muted for Human Handoff
  if (conversation.status === 'HUMAN_HANDOFF') {
    console.log(
      '\n\x1b[33m[Bot Muted]\x1b[0m This conversation is currently under \x1b[1mHUMAN_HANDOFF\x1b[0m.'
    );
    console.log('Automated AI replies are paused until an admin resolves or returns to bot.\n');
    return;
  }

  // Check if currently inside booking state machine
  const inBookingFlow =
    ['SELECT_SERVICE', 'SELECT_DATE', 'SELECT_SLOT', 'CONFIRM'].includes(conversation.state_step) ||
    Boolean(buttonId?.startsWith('DATE_') || buttonId?.startsWith('SLOT_') || buttonId === 'CONFIRM_BOOKING');

  if (inBookingFlow) {
    const result = await bookingService.processBookingState(
      business.id,
      conversation.id,
      DEFAULT_PHONE,
      conversation.state_step,
      (conversation.state_data as any) || {},
      userText,
      buttonId
    );

    // Record response
    await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender: 'ASSISTANT',
        message: result.replyText,
        message_type: result.buttons ? 'interactive' : 'text',
      },
    });

    renderBotReply(result.replyText, result.buttons);
    return;
  }

  // Intent analysis
  const recentMessages = await prisma.message.findMany({
    where: { conversation_id: conversation.id },
    orderBy: { created_at: 'desc' },
    take: 6,
  });

  const history = recentMessages.reverse().map((m) => ({
    role: m.sender === 'CUSTOMER' ? ('user' as const) : ('assistant' as const),
    content: m.message,
  }));

  const analysis = await geminiService.analyzeIntent(userText, history);

  // 1. Emergency guardrail
  if (analysis.isEmergency || analysis.intent === 'EMERGENCY') {
    const emergencyAlert = geminiService.getEmergencyMessage(business.phone);
    await handoffService.escalateToHuman(
      conversation.id,
      DEFAULT_PHONE,
      analysis.emergencyReason || 'Critical Medical Emergency Detected',
      emergencyAlert
    );
    renderBotReply(emergencyAlert);
    return;
  }

  // 2. Human handoff
  if (analysis.intent === 'HUMAN_AGENT') {
    const handoffMsg =
      `👤 *Human Receptionist Handoff*\n\n` +
      `Sure! I have notified our front desk receptionist. A team member will assist you here shortly.`;
    await handoffService.escalateToHuman(
      conversation.id,
      DEFAULT_PHONE,
      'Patient requested human receptionist assistance',
      handoffMsg
    );
    renderBotReply(handoffMsg);
    return;
  }

  // 3. Booking Intent
  if (analysis.intent === 'BOOKING') {
    const result = await bookingService.processBookingState(
      business.id,
      conversation.id,
      DEFAULT_PHONE,
      'START',
      {},
      userText,
      buttonId
    );

    await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender: 'ASSISTANT',
        message: result.replyText,
        message_type: result.buttons ? 'interactive' : 'text',
      },
    });

    renderBotReply(result.replyText, result.buttons);
    return;
  }

  // 4. FAQ / General Conversation with 2-tier RAG
  const reply = await ragService.generateGroundedAnswer({
    businessId: business.id,
    businessName: business.name,
    userMessage: userText,
    history,
    languageHint: analysis.language,
  });

  await prisma.message.create({
    data: {
      conversation_id: conversation.id,
      sender: 'ASSISTANT',
      message: reply,
      message_type: 'text',
    },
  });

  renderBotReply(reply);
}

function renderBotReply(text: string, buttons?: Array<{ id: string; title: string }>) {
  console.log('\n\x1b[32m┌── 🤖 Aditi (Dr. Kumar Dental Clinic) ─────────────────────────┐\x1b[0m');
  const lines = text.split('\n');
  for (const line of lines) {
    console.log(`\x1b[32m│\x1b[0m ${line}`);
  }

  if (buttons && buttons.length > 0) {
    activeButtons = buttons;
    console.log('\x1b[32m│\x1b[0m');
    console.log('\x1b[32m│\x1b[0m \x1b[1m\x1b[34m[Interactive WhatsApp Buttons]:\x1b[0m');
    buttons.forEach((btn, idx) => {
      console.log(`\x1b[32m│\x1b[0m  \x1b[36m[${idx + 1}]\x1b[0m ${btn.title}`);
    });
  }

  console.log('\x1b[32m└───────────────────────────────────────────────────────────────┘\x1b[0m\n');
}

async function promptUser() {
  rl.question('\x1b[1m\x1b[37m[You / WhatsApp]\x1b[0m > ', async (input) => {
    const trimmed = input.trim();

    if (!trimmed) {
      promptUser();
      return;
    }

    if (trimmed === '/exit' || trimmed === 'exit') {
      console.log('\n👋 Exiting WhatsApp simulator. Goodbye!\n');
      rl.close();
      process.exit(0);
    }

    if (trimmed === '/reset') {
      const biz = await prisma.business.findFirst({ where: { status: 'ACTIVE' } });
      const cust = await prisma.customer.findFirst({ where: { phone: DEFAULT_PHONE } });
      if (biz && cust) {
        await prisma.conversation.deleteMany({
          where: { business_id: biz.id, customer_id: cust.id },
        });
      }
      activeButtons = [];
      console.log('\n\x1b[33m[Simulator]\x1b[0m Conversation history reset to START.\n');
      promptUser();
      return;
    }

    if (trimmed === '/status') {
      const cust = await prisma.customer.findFirst({ where: { phone: DEFAULT_PHONE } });
      const conv = await prisma.conversation.findFirst({
        where: { customer_id: cust?.id },
        orderBy: { updated_at: 'desc' },
      });
      const appts = await prisma.appointment.findMany({
        where: { customer_id: cust?.id },
        include: { service: true },
      });

      console.log('\n\x1b[35m=== CONVERSATION DIAGNOSTICS ===\x1b[0m');
      console.log('Status    :', conv?.status || 'NONE');
      console.log('Step      :', conv?.state_step || 'START');
      console.log('State Data:', JSON.stringify(conv?.state_data || {}));
      console.log('Bookings  :', appts.length, 'appointment(s)');
      appts.forEach((a) => {
        console.log(`  • ${a.service.name} @ ${new Date(a.start_at).toLocaleString('en-IN')} [${a.status}]`);
      });
      console.log('================================\n');
      promptUser();
      return;
    }

    await simulateIncomingMessage(trimmed);
    promptUser();
  });
}

async function start() {
  await printBanner();
  console.log('💡 Try typing:');
  console.log('  1. "Vanakkam, clinic timings enna?"');
  console.log('  2. "Root canal cost evlo?"');
  console.log('  3. "Doctor ku appointment venum"');
  console.log('  4. "Chest pain and severe bleeding"\n');
  promptUser();
}

start().catch(console.error);
