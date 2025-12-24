import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Password Hash (Common for both)
  const password = await bcrypt.hash('123456', 10);

  // -------------------------------------------
  // 1. Create RIDER (User Table)
  // -------------------------------------------
  const rider = await prisma.user.upsert({
    where: { email: 'rahul@uber.com' },
    update: {},
    create: {
      email: 'rahul@uber.com',
      firstName: 'Rahul',  // ✅ Fixed: Name split
      lastName: 'Rider',   // ✅ Fixed
      password: password,
      role: 'rider',
      rating: 5.0
      // Note: User table mein phone/car details nahi hain
    },
  });
  console.log('👤 Rider Created:', rider.email);

  // -------------------------------------------
  // 2. Create DRIVER (Driver Table)
  // -------------------------------------------
  // Hum wahi ID use karenge jo Driver App mein hardcoded hai
  const driverId = '4e90f50f-a7b7-4309-862b-959cf28a71ac'; 
  
  const driver = await prisma.driver.upsert({
    where: { email: 'vikram@uber.com' }, // Email se check karenge duplicate
    update: {
       isOnline: true // Agar pehle se hai toh bas online kar do
    },
    create: {
      id: driverId, // ⚠️ Hardcoded ID zaroori hai simulation ke liye
      email: 'vikram@uber.com',
      firstName: 'Vikram', // ✅ Fixed
      lastName: 'Driver',  // ✅ Fixed
      password: password,
      phone: '9876543210',
      
      // Car Details
      carModel: 'Swift Dzire',
      carNumber: 'DL-10-CB-1234',
      carType: 'uber_go',
      
      isOnline: true,
      rating: 4.8
    },
  });
  console.log('🚕 Driver Created:', driver.email);

  console.log('✅ Seeding Finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });