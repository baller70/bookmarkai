const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    
    console.log('Users in database:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
