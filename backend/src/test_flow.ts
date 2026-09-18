import { prisma } from './lib/prisma';
import { geminiService } from './services/gemini.service';
import { ragService } from './services/rag.service';
import { bookingService } from './services/booking.service';
import { handoffService } from './services/handoff.service';

async function runTests() {
  console.log('🧪 Starting automated end-to-end verification...\n');

  const biz = await prisma.business.findFirst({ where: { status: 'ACTIVE' } });
  if (!biz) throw new Error('No active business found');

  // Test 1: RAG Retrieval on pgvector
  console.log('--- Test 1: RAG Knowledge Retrieval ---');
  const ragResults = await ragService.searchKnowledge(biz.id, 'clinic timings doctor eppo irupaaru', 2);
  console.log(`Retrieved ${ragResults.length} chunks from pgvector:`);
  ragResults.forEach((r, idx) => console.log(`  [${idx + 1}] (Score: ${r.similarity.toFixed(3)}) ${r.content.slice(0, 80)}...`));
  if (ragResults.length === 0) throw new Error('RAG search returned 0 results');
  console.log('✅ Test 1 Passed!\n');

  // Test 2: Tanglish Conversational Answer
  console.log('--- Test 2: Tanglish Answer Generation ---');
  const userQuery = 'Vanakkam, clinic timing enna? Doctor eppo irupaaru?';
  const answer = await geminiService.generateRagAnswer(
    biz.name,
    userQuery,
    ragResults.map((r) => r.content),
    [],
    'tanglish'
  );
  console.log('Bot Response:');
  console.log(answer);
  if (!answer.toLowerCase().includes('9:00 am') && !answer.toLowerCase().includes('dr. kumar')) {
    throw new Error('Bot reply missing clinic timing facts');
  }
  console.log('✅ Test 2 Passed!\n');

  // Test 3: Medical Emergency Guardrail
  console.log('--- Test 3: Medical Emergency Detection ---');
  const emergencyQuery = 'Severe bleeding after tooth accident and chest pain';
  const analysis = await geminiService.analyzeIntent(emergencyQuery);
  console.log('Intent analysis:', analysis);
  if (!analysis.isEmergency) throw new Error('Emergency was NOT detected!');
  const emergencyMsg = geminiService.getEmergencyMessage(biz.phone);
  console.log('Emergency Alert:\n', emergencyMsg.slice(0, 150) + '...');
  console.log('✅ Test 3 Passed!\n');

  // Test 4: End-to-End Deterministic Booking Flow
  console.log('--- Test 4: Booking State Machine Flow ---');
  const testPhone = '919999988888';
  let cust = await prisma.customer.findUnique({
    where: { business_id_phone: { business_id: biz.id, phone: testPhone } },
  });
  if (!cust) {
    cust = await prisma.customer.create({
      data: { business_id: biz.id, phone: testPhone, name: 'Automated Test User' },
    });
  }

  // Clean previous conversation
  await prisma.conversation.deleteMany({
    where: { business_id: biz.id, customer_id: cust.id },
  });

  const conv = await prisma.conversation.create({
    data: {
      business_id: biz.id,
      customer_id: cust.id,
      status: 'BOT',
      state_step: 'START',
      state_data: {},
    },
  });

  // Step A: Trigger booking
  console.log('Step A: Trigger booking "Doctor ku appointment venum"');
  const stepA = await bookingService.processBookingState(
    biz.id,
    conv.id,
    testPhone,
    'START',
    {},
    'Doctor ku appointment venum'
  );
  console.log('Reply:\n', stepA.replyText.slice(0, 120) + '...');
  console.log('Buttons:', stepA.buttons?.map((b) => b.title));
  if (!stepA.buttons || stepA.buttons.length === 0) throw new Error('Step A did not present services');

  // Step B: Select Service (Consultation)
  console.log('\nStep B: Select Service "Consultation"');
  const serviceBtn = stepA.buttons[0];
  const stepB = await bookingService.processBookingState(
    biz.id,
    conv.id,
    testPhone,
    'SELECT_SERVICE',
    {},
    serviceBtn.title,
    serviceBtn.id
  );
  console.log('Reply:\n', stepB.replyText.slice(0, 120) + '...');
  console.log('Buttons:', stepB.buttons?.map((b) => b.title));
  if (!stepB.buttons || stepB.buttons.length === 0) throw new Error('Step B did not present dates');

  // Step C: Select Date (Tomorrow)
  console.log('\nStep C: Select Date "Tomorrow"');
  const dateBtn = stepB.buttons[1]; // Tomorrow
  const convB = await prisma.conversation.findUnique({ where: { id: conv.id } });
  const stepC = await bookingService.processBookingState(
    biz.id,
    conv.id,
    testPhone,
    'SELECT_DATE',
    (convB?.state_data as any) || {},
    dateBtn.title,
    dateBtn.id
  );
  console.log('Reply:\n', stepC.replyText.slice(0, 120) + '...');
  console.log('Slots:', stepC.buttons?.map((b) => b.title));
  if (!stepC.buttons || stepC.buttons.length === 0) throw new Error('Step C did not present slots');

  // Step D: Select Slot (First Slot)
  console.log('\nStep D: Select Slot', stepC.buttons[0].title);
  const slotBtn = stepC.buttons[0];
  const convC = await prisma.conversation.findUnique({ where: { id: conv.id } });
  const stepD = await bookingService.processBookingState(
    biz.id,
    conv.id,
    testPhone,
    'SELECT_SLOT',
    (convC?.state_data as any) || {},
    slotBtn.title,
    slotBtn.id
  );
  console.log('Reply:\n', stepD.replyText.slice(0, 150) + '...');
  console.log('Buttons:', stepD.buttons?.map((b) => b.title));

  // Step E: Confirm Booking
  console.log('\nStep E: Confirm Booking');
  const convD = await prisma.conversation.findUnique({ where: { id: conv.id } });
  const stepE = await bookingService.processBookingState(
    biz.id,
    conv.id,
    testPhone,
    'CONFIRM',
    (convD?.state_data as any) || {},
    'Confirm Booking',
    'CONFIRM_BOOKING'
  );
  console.log('Confirmation Message:\n', stepE.replyText);

  // Check appointment in database
  const createdAppt = await prisma.appointment.findFirst({
    where: { customer_id: cust.id, status: 'CONFIRMED' },
    include: { service: true, staff: true },
    orderBy: { created_at: 'desc' },
  });

  if (!createdAppt) throw new Error('Appointment was NOT created in database!');
  console.log(`\n🎉 Verified Appointment #${createdAppt.id} in DB:`);
  console.log(`   Service: ${createdAppt.service.name} (₹${createdAppt.service.price})`);
  console.log(`   Staff  : ${createdAppt.staff.name}`);
  console.log(`   Timing : ${createdAppt.start_at.toISOString()}`);
  console.log('✅ Test 4 Passed!\n');

  console.log('✨ ALL BACKEND FLOWS & GUARDRAILS 100% VERIFIED! ✨');
}

runTests()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
