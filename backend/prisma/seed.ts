import { PrismaClient } from '@prisma/client';
import { ragService } from '../src/services/rag.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Dr. Kumar Dental Clinic and Luxe Unisex Salon & Spa...');

  // 1. Clean previous data
  await prisma.reminder.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.knowledgeChunk.deleteMany();
  await prisma.knowledgeDocument.deleteMany();
  await prisma.service.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  // ==========================================
  // 2. SECTOR 1: Dr. Kumar Dental Clinic
  // ==========================================
  const clinic = await prisma.business.create({
    data: {
      name: 'Dr. Kumar Dental Clinic',
      category: 'Dental Clinic',
      phone: '+91 98401 23456',
      timezone: 'Asia/Kolkata',
      address: 'No. 45, Anna Nagar 2nd Avenue, Chennai, Tamil Nadu - 600040 (Near Tower Metro)',
      status: 'ACTIVE',
      whatsapp_phone_number_id: '1335214009670704',
    },
  });
  console.log(`✅ Created Clinic: ${clinic.name} (${clinic.id})`);

  // Admin User
  await prisma.user.create({
    data: {
      business_id: clinic.id,
      name: 'Dr. Kumar Admin',
      email: 'admin@kumardental.com',
      password_hash: '$2b$10$demoHashedPasswordAdmin1234567890',
      role: 'ADMIN',
    },
  });

  // Doctor
  const doctor = await prisma.staff.create({
    data: {
      business_id: clinic.id,
      name: 'Dr. A. Kumar, MDS',
      role: 'Chief Dental Surgeon',
      availability_schedule: {
        start: '09:00',
        end: '19:00',
        lunchStart: '13:00',
        lunchEnd: '14:00',
        slotDuration: 30,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      },
    },
  });

  // Dental Services
  const clinicServices = await Promise.all([
    prisma.service.create({
      data: {
        business_id: clinic.id,
        name: 'Consultation & Dental Checkup',
        duration_minutes: 30,
        price: 500,
        status: 'ACTIVE',
      },
    }),
    prisma.service.create({
      data: {
        business_id: clinic.id,
        name: 'Root Canal Treatment (RCT)',
        duration_minutes: 60,
        price: 4500,
        status: 'ACTIVE',
      },
    }),
    prisma.service.create({
      data: {
        business_id: clinic.id,
        name: 'Teeth Cleaning & Polishing',
        duration_minutes: 45,
        price: 1200,
        status: 'ACTIVE',
      },
    }),
    prisma.service.create({
      data: {
        business_id: clinic.id,
        name: 'Laser Teeth Whitening',
        duration_minutes: 45,
        price: 3000,
        status: 'ACTIVE',
      },
    }),
    prisma.service.create({
      data: {
        business_id: clinic.id,
        name: 'Composite Dental Fillings',
        duration_minutes: 30,
        price: 1000,
        status: 'ACTIVE',
      },
    }),
  ]);

  // Demo Appointment
  const clinicCustomer = await prisma.customer.create({
    data: {
      business_id: clinic.id,
      name: 'Rajesh Murugan',
      phone: '919876543210',
      metadata: { city: 'Chennai', preferredLanguage: 'tanglish' },
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setMinutes(tomorrowEnd.getMinutes() + 30);

  await prisma.appointment.create({
    data: {
      business_id: clinic.id,
      customer_id: clinicCustomer.id,
      service_id: clinicServices[0].id,
      staff_id: doctor.id,
      start_at: tomorrow,
      end_at: tomorrowEnd,
      status: 'CONFIRMED',
      notes: 'Initial checkup for mild tooth sensitivity',
    },
  });

  // Clinic Knowledge Base
  const clinicDocs = [
    {
      title: 'Clinic Timings & Working Days',
      content:
        'Dr. Kumar Dental Clinic operates Monday through Saturday from 9:00 AM to 7:00 PM without weekly breaks except Sundays. Sunday the clinic is closed. Lunch hour is strictly observed between 1:00 PM and 2:00 PM. Patients can book slots every 30 minutes. Emergency walk-ins are given high priority between 9:00 AM and 11:00 AM.',
    },
    {
      title: 'Consultation Charges & Pricing Policy',
      content:
        'Doctor consultation and complete oral examination fee is ₹500. Root canal treatment is ₹4,500 per tooth including digital X-rays. Professional ultrasonic teeth scaling and polishing is ₹1,200. Laser teeth whitening is ₹3,000 per session. Composite tooth-colored fillings cost ₹1,000 per tooth surface. We accept UPI (Google Pay, PhonePe, Paytm), all major credit and debit cards, cash, and health insurance claims.',
    },
    {
      title: 'Location, Metro & Parking Directions',
      content:
        'Dr. Kumar Dental Clinic is located at No. 45, Anna Nagar 2nd Avenue, Chennai, Tamil Nadu - 600040. Landmark: Right opposite the Roundtana Post Office and only 2 minutes walking distance from Anna Nagar Tower Metro Station. Dedicated parking for cars and two-wheelers is available directly inside the clinic complex.',
    },
    {
      title: 'Emergency Medical & Dental Policy',
      content:
        'For urgent severe emergencies such as continuous heavy bleeding, broken jaw, knocked-out tooth from road accidents, or acute facial swelling with breathing difficulty, immediately call our emergency hotline at +91 98401 23456 or dial 108 for national emergency ambulance services. Immediate trauma care is provided without advance appointment.',
    },
    {
      title: 'Tamil and Tanglish Clinic FAQ',
      content:
        'Doctor eppo irupaaru? Dr. Kumar Monday to Saturday daily 9:00 AM le irundhu 7:00 PM varaikum clinic la irukaaru. Sunday leave. Consultation fee evlo? Consultation charge ₹500 mattum thaan. Tooth cleaning evlo aagum? Teeth scaling cleaning ₹1200 aagum. Treatment ku pain irukuma? Illai, latest painless computer-controlled local anaesthesia use pandrom, pain irukaadhu. Location enga iruku? Anna Nagar Tower metro station pakkathula, Roundtana post office opposite la iruku.',
    },
  ];

  console.log('🧠 Indexing Clinic Knowledge Documents...');
  for (const docData of clinicDocs) {
    const doc = await prisma.knowledgeDocument.create({
      data: {
        business_id: clinic.id,
        title: docData.title,
        content: docData.content,
        status: 'ACTIVE',
      },
    });
    await ragService.indexDocument(doc.id, clinic.id, doc.content);
  }

  // ==========================================
  // 3. SECTOR 2: Luxe Unisex Salon & Spa
  // ==========================================
  const salon = await prisma.business.create({
    data: {
      name: 'Luxe Unisex Salon & Spa',
      category: 'Salon & Spa',
      phone: '+91 98402 34567',
      timezone: 'Asia/Kolkata',
      address: 'No. 12, G.N. Chetty Road, T. Nagar, Chennai, Tamil Nadu - 600017 (Near Panagal Park & Residency Towers)',
      status: 'INACTIVE', // Switched to ACTIVE when toggled in dashboard
      whatsapp_phone_number_id: '1335214009670704',
    },
  });
  console.log(`✅ Created Salon: ${salon.name} (${salon.id})`);

  // Salon Admin User
  await prisma.user.create({
    data: {
      business_id: salon.id,
      name: 'Luxe Salon Admin',
      email: 'admin@luxesalon.com',
      password_hash: '$2b$10$demoHashedPasswordAdmin1234567890',
      role: 'ADMIN',
    },
  });

  // Salon Stylists
  const stylistVikram = await prisma.staff.create({
    data: {
      business_id: salon.id,
      name: 'Vikram',
      role: 'Senior Hair Stylist & Colorist',
      availability_schedule: {
        start: '10:00',
        end: '20:30',
        lunchStart: '14:00',
        lunchEnd: '15:00',
        slotDuration: 30,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
    },
  });

  const stylistPriya = await prisma.staff.create({
    data: {
      business_id: salon.id,
      name: 'Priya',
      role: 'Skin & Bridal Care Specialist',
      availability_schedule: {
        start: '10:00',
        end: '19:30',
        lunchStart: '13:30',
        lunchEnd: '14:30',
        slotDuration: 45,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      },
    },
  });

  // Salon Services
  const salonServices = await Promise.all([
    prisma.service.create({
      data: {
        business_id: salon.id,
        name: 'Classic & Trend Haircut & Wash',
        duration_minutes: 30,
        price: 350,
        status: 'ACTIVE',
      },
    }),
    prisma.service.create({
      data: {
        business_id: salon.id,
        name: 'Beard Styling & Royal Shave',
        duration_minutes: 20,
        price: 200,
        status: 'ACTIVE',
      },
    }),
    prisma.service.create({
      data: {
        business_id: salon.id,
        name: 'Keratin Hair Spa & Treatment',
        duration_minutes: 45,
        price: 1200,
        status: 'ACTIVE',
      },
    }),
    prisma.service.create({
      data: {
        business_id: salon.id,
        name: 'Deep Cleansing Gold Facial & De-Tan',
        duration_minutes: 60,
        price: 1500,
        status: 'ACTIVE',
      },
    }),
    prisma.service.create({
      data: {
        business_id: salon.id,
        name: 'Deluxe Pedicure & Manicure',
        duration_minutes: 45,
        price: 800,
        status: 'ACTIVE',
      },
    }),
    prisma.service.create({
      data: {
        business_id: salon.id,
        name: 'Bridal & Groom Makeover Package',
        duration_minutes: 90,
        price: 4500,
        status: 'ACTIVE',
      },
    }),
  ]);

  // Salon Sample Customer & Appointment
  const salonCustomer = await prisma.customer.create({
    data: {
      business_id: salon.id,
      name: 'Ananya Sharma',
      phone: '919876543211',
      metadata: { city: 'Chennai', preferredService: 'Keratin Hair Spa' },
    },
  });

  const salonAppointmentTime = new Date();
  salonAppointmentTime.setDate(salonAppointmentTime.getDate() + 1);
  salonAppointmentTime.setHours(15, 0, 0, 0);
  const salonAppointmentEnd = new Date(salonAppointmentTime);
  salonAppointmentEnd.setMinutes(salonAppointmentEnd.getMinutes() + 45);

  await prisma.appointment.create({
    data: {
      business_id: salon.id,
      customer_id: salonCustomer.id,
      service_id: salonServices[2].id, // Keratin Hair Spa
      staff_id: stylistVikram.id,
      start_at: salonAppointmentTime,
      end_at: salonAppointmentEnd,
      status: 'CONFIRMED',
      notes: 'Hair spa and split end trimming',
    },
  });

  // Salon Knowledge Base
  const salonDocs = [
    {
      title: 'Salon Working Hours & Stylist Availability',
      content:
        'Luxe Unisex Salon & Spa is open all 7 days a week from 10:00 AM to 8:30 PM. We cater to both men and women with separate styling lounges. Senior Hair Stylist Vikram is available every day. Skin Care Specialist Priya is available Monday to Saturday. Walk-ins are warmly accepted, though booking a 30-min slot in advance is highly recommended to skip wait times.',
    },
    {
      title: 'Treatment Menu, Pricing & Offers',
      content:
        'Men Haircut & Wash: ₹350. Women Haircut & Blowdry: ₹600. Beard styling with hot towel massage: ₹200. Keratin hair spa & deep conditioning: ₹1,200. 24K Gold Glow Facial & De-Tan: ₹1,500. Deluxe Foot Pedicure & Hand Manicure: ₹800. Complete Bridal / Groom Makeover packages start from ₹4,500. We exclusively use authentic L’Oreal Professionnel, Schwarzkopf, and dermatologically tested organic facial products.',
    },
    {
      title: 'Salon Location & Parking Details',
      content:
        'Luxe Unisex Salon & Spa is located at No. 12, G.N. Chetty Road, T. Nagar, Chennai, Tamil Nadu - 600017. Landmark: Directly opposite The Residency Towers hotel, just 3 minutes walk from Panagal Park. Complimentary valet parking is provided for all customers.',
    },
    {
      title: 'Safety, Hygiene & Skin Allergy Policy',
      content:
        'Safety and hygiene are our top priorities. All haircutting scissors, razors, and facial tools are 100% UV-sanitized before every single use. We use single-use disposable capes, towels, and fresh razor blades. For global hair color or keratin straightening treatments, a 24-hour skin patch test is provided free of charge to guarantee zero allergic reactions.',
    },
    {
      title: 'Tamil and Tanglish Salon FAQ',
      content:
        'Haircut panna appointment venuma? Walk-in varalaam, aana "Book appointment" nu reply panni slot book panna waiting time illama direct ah pannikalam. Hair spa cost evlo? Keratin hair spa ₹1200 mattum thaan. Beard styling evlo? Beard trim and royal shave ₹200. Stylist Vikram eppo irupaaru? Vikram daily 10:00 AM to 8:30 PM irupaaru. Facial evlo aagum? 24K Gold glow facial ₹1500. Location enga iruku? T. Nagar G.N. Chetty Road la Residency Towers hotel opposite la iruku, car parking valet facility iruku.',
    },
  ];

  console.log('🧠 Indexing Salon Knowledge Documents...');
  for (const docData of salonDocs) {
    const doc = await prisma.knowledgeDocument.create({
      data: {
        business_id: salon.id,
        title: docData.title,
        content: docData.content,
        status: 'ACTIVE',
      },
    });
    await ragService.indexDocument(doc.id, salon.id, doc.content);
  }

  console.log('🎉 Seeding of both Clinic & Salon sectors completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
