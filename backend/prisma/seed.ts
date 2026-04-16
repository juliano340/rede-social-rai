import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating users...');
  const hash = await bcrypt.hash('test123', 10);
  
  const names = ['alice', 'bob', 'carla', 'david', 'emma', 'felipe', 'gabi', 'henrique', 'isabel', 'joao', 'lair340'];
  const users: any = [];
  for (const n of names) {
    const u = await prisma.user.upsert({
      where: { username: n },
      update: {},
      create: { username: n, email: `${n}@rai.com`, password: hash, name: n.charAt(0).toUpperCase() + n.slice(1) },
    });
    users.push(u.id);
  }
  console.log('✅ 11 users');

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());