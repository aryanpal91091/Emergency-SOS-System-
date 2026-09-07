import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ResQRoute database...');

  // Clean existing records
  await prisma.emergencyStatusHistory.deleteMany();
  await prisma.trafficAlert.deleteMany();
  await prisma.hospitalAlert.deleteMany();
  await prisma.emergencyRoute.deleteMany();
  await prisma.emergency.deleteMany();
  await prisma.ambulance.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.trafficSignal.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const citizen = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'citizen@resqroute.org',
      phone: '+1 (555) 019-2834',
      password: hashedPassword,
      role: 'CITIZEN',
    },
  });

  const driver1User = await prisma.user.create({
    data: {
      name: 'John Miller (AMB-101)',
      email: 'driver1@resqroute.org',
      phone: '+1 (555) 839-2019',
      password: hashedPassword,
      role: 'DRIVER',
    },
  });

  const driver2User = await prisma.user.create({
    data: {
      name: 'David Vance (AMB-102)',
      email: 'driver2@resqroute.org',
      phone: '+1 (555) 948-1102',
      password: hashedPassword,
      role: 'DRIVER',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Officer Robert Chen',
      email: 'police@resqroute.org',
      phone: '+1 (555) 777-9111',
      password: hashedPassword,
      role: 'POLICE',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Dr. Elena Rostova',
      email: 'hospital@resqroute.org',
      phone: '+1 (555) 333-8888',
      password: hashedPassword,
      role: 'HOSPITAL',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Commander Marcus Vance',
      email: 'admin@resqroute.org',
      phone: '+1 (555) 000-1111',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // 2. Create Hospitals
  const cityHospital = await prisma.hospital.create({
    data: {
      name: 'City General Medical & Trauma Center',
      latitude: 28.6289,
      longitude: 77.2065,
      address: '77 Medical Drive, Central Sector, City Center',
      totalBeds: 120,
      availableBeds: 18,
      icuBeds: 6,
      contactPhone: '+1 (555) 900-Trauma',
    },
  });

  await prisma.hospital.create({
    data: {
      name: 'Metro Heart & Stroke Super Speciality Institute',
      latitude: 28.6012,
      longitude: 77.2289,
      address: '14 Cardiology Avenue, South Wing',
      totalBeds: 85,
      availableBeds: 9,
      icuBeds: 4,
      contactPhone: '+1 (555) 900-Heart',
    },
  });

  // 3. Create Ambulances
  await prisma.ambulance.create({
    data: {
      vehicleNumber: 'AMB-101',
      driverId: driver1User.id,
      latitude: 28.6139,
      longitude: 77.209,
      status: 'AVAILABLE',
      vehicleType: 'ADVANCED_ICU',
      equipmentLevel: 'ICU Ventilator, Defibrillator, Cardiac Monitor',
      hospitalId: cityHospital.id,
    },
  });

  await prisma.ambulance.create({
    data: {
      vehicleNumber: 'AMB-102',
      driverId: driver2User.id,
      latitude: 28.622,
      longitude: 77.218,
      status: 'AVAILABLE',
      vehicleType: 'TRAUMA',
      equipmentLevel: 'Trauma Resuscitation Kit, Oxygen, Blood Transfusion Prep',
      hospitalId: cityHospital.id,
    },
  });

  await prisma.ambulance.create({
    data: {
      vehicleNumber: 'AMB-103',
      latitude: 28.605,
      longitude: 77.215,
      status: 'AVAILABLE',
      vehicleType: 'BASIC',
      equipmentLevel: 'Basic Life Support, Stretcher, First Aid',
      hospitalId: cityHospital.id,
    },
  });

  // 4. Create Traffic Signals
  await prisma.trafficSignal.create({
    data: {
      signalCode: 'SIG-01',
      name: 'Connaught Central Circus Intersection',
      latitude: 28.6165,
      longitude: 77.2115,
      status: 'NORMAL',
      intersectionGroup: 'Sector 1 Green Corridor',
    },
  });

  await prisma.trafficSignal.create({
    data: {
      signalCode: 'SIG-02',
      name: 'Kingsway Boulevard & 4th Avenue Crossing',
      latitude: 28.621,
      longitude: 77.209,
      status: 'NORMAL',
      intersectionGroup: 'Sector 1 Green Corridor',
    },
  });

  await prisma.trafficSignal.create({
    data: {
      signalCode: 'SIG-03',
      name: 'Hospital Gate Emergency Junction',
      latitude: 28.6275,
      longitude: 77.2072,
      status: 'NORMAL',
      intersectionGroup: 'Hospital Access Zone',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
