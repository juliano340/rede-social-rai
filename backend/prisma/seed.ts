import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating test users...');

  // Create test users (password: "test123")
  const hash = await bcrypt.hash('test123', 10);

  const user1 = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@rai.com',
      password: hash,
      name: 'Alice Silva',
      bio: 'Desenvolvedora Frontend | Amante de Angular',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: {
      username: 'bob',
      email: 'bob@rai.com',
      password: hash,
      name: 'Bob Santos',
      bio: 'Backend Developer | Node.js & NestJS',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { username: 'carla' },
    update: {},
    create: {
      username: 'carla',
      email: 'carla@rai.com',
      password: hash,
      name: 'Carla Oliveira',
      bio: 'UX Designer | Criando interfaces legais',
    },
  });

  console.log('✅ Created test users:');
  console.log('  - alice (alice@rai.com) - password: test123');
  console.log('  - bob (bob@rai.com) - password: test123');
  console.log('  - carla (carla@rai.com) - password: test123');

  // Create some test posts
  const post1 = await prisma.post.create({
    data: {
      content: 'Olá! Primeira postagem no RAI! 🚀',
      authorId: user1.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      content: 'Aprendendo NestJS é demais! 🔥',
      authorId: user2.id,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      content: 'Design não é só sobre como as coisas parecem, é sobre como funcionam. 🎨',
      authorId: user3.id,
    },
  });

  console.log('✅ Created test posts');

  // Alice follows Bob
  await prisma.follow.create({
    data: {
      followerId: user1.id,
      followingId: user2.id,
    },
  });

  // Bob follows Alice
  await prisma.follow.create({
    data: {
      followerId: user2.id,
      followingId: user1.id,
    },
  });

  // Carla follows Alice
  await prisma.follow.create({
    data: {
      followerId: user3.id,
      followingId: user1.id,
    },
  });

  console.log('✅ Created follow relationships');
  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });