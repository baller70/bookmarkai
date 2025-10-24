
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create default test user (admin)
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'John Doe',
      role: 'admin',
      avatar: '/avatars/default.png',
    },
  });

  console.log('Created test user:', testUser.email);

  // Create default settings for test user
  await prisma.userSettings.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      theme: 'system',
      accentColor: 'blue',
      defaultView: 'grid',
    },
  });

  await prisma.aiSettings.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      autoProcessing: true,
      smartTags: true,
      autoCategory: true,
    },
  });

  // Create test user from request
  const testUserHash = await bcrypt.hash('test123456', 10);
  const appTestUser = await prisma.user.upsert({
    where: { email: 'test@bookmarkhub.com' },
    update: {},
    create: {
      email: 'test@bookmarkhub.com',
      password: testUserHash,
      name: 'Test User',
      role: 'user',
    },
  });

  console.log('Created app test user:', appTestUser.email);

  // Create default settings
  await prisma.userSettings.upsert({
    where: { userId: appTestUser.id },
    update: {},
    create: {
      userId: appTestUser.id,
    },
  });

  await prisma.aiSettings.upsert({
    where: { userId: appTestUser.id },
    update: {},
    create: {
      userId: appTestUser.id,
    },
  });

  // Create some sample bookmarks
  const sampleBookmarks = [
    {
      title: 'GitHub',
      url: 'https://github.com',
      description: 'Where the world builds software',
      category: 'Development',
      tags: ['code', 'development', 'git'],
      favicon: 'https://github.githubassets.com/favicon.ico',
    },
    {
      title: 'Stack Overflow',
      url: 'https://stackoverflow.com',
      description: 'Q&A for professional and enthusiast programmers',
      category: 'Development',
      tags: ['code', 'help', 'community'],
      favicon: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico',
    },
    {
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org',
      description: 'Resources for developers, by developers',
      category: 'Learning',
      tags: ['documentation', 'web', 'reference'],
      favicon: 'https://developer.mozilla.org/favicon-48x48.png',
    },
  ];

  for (const bookmark of sampleBookmarks) {
    await prisma.bookmark.create({
      data: {
        ...bookmark,
        userId: appTestUser.id,
      },
    });
  }

  console.log('Created sample bookmarks');

  // Create default folder
  const defaultFolder = await prisma.folder.create({
    data: {
      userId: appTestUser.id,
      name: 'My Bookmarks',
      description: 'Default folder for bookmarks',
      color: 'blue',
    },
  });

  console.log('Created default folder:', defaultFolder.name);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
