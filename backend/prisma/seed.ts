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

  // Create more posts with likes and comments
  const post4 = await prisma.post.create({
    data: {
      content: 'Angular 17 está incrível! Os signals mudam completamente a forma de escrever código. 💡',
      authorId: user1.id,
    },
  });

  const post5 = await prisma.post.create({
    data: {
      content: 'Prisma + PostgreSQL = combinação perfeita para APIs Node.js 🚀',
      authorId: user2.id,
    },
  });

  const post6 = await prisma.post.create({
    data: {
      content: 'Cores e tipografia são a base de qualquer bom design. 🎨✨',
      authorId: user3.id,
    },
  });

  const post7 = await prisma.post.create({
    data: {
      content: 'Trabalhando em um novo projeto de rede social! Empolgado para mostrar em breve 📱',
      authorId: user1.id,
    },
  });

  // Create likes
  const likes = [
    { postId: post1.id, userId: user2.id },
    { postId: post1.id, userId: user3.id },
    { postId: post2.id, userId: user1.id },
    { postId: post3.id, userId: user1.id },
    { postId: post3.id, userId: user2.id },
    { postId: post4.id, userId: user2.id },
    { postId: post5.id, userId: user1.id },
    { postId: post6.id, userId: user1.id },
    { postId: post6.id, userId: user2.id },
  ];
  
  for (const like of likes) {
    try {
      await prisma.like.create({ data: like });
    } catch (e) {
      // Skip duplicates
    }
  }

  // Create comments (replies)
  const replies = [
    { content: 'Parabéns pelo projeto!', postId: post1.id, authorId: user2.id },
    { content: 'Muito legal!', postId: post1.id, authorId: user3.id },
    { content: 'Concordo! Angular tá evoluindo muito', postId: post4.id, authorId: user2.id },
    { content: 'Show! Angular 17 é tooooop', postId: post4.id, authorId: user3.id },
    { content: 'Prisma facilita demais o trabalho!', postId: post5.id, authorId: user3.id },
    { content: 'Design minimalista é o melhor 🎯', postId: post6.id, authorId: user1.id },
    { content: 'Mal posso esperar para ver!', postId: post7.id, authorId: user2.id },
  ];
  
  for (const reply of replies) {
    await prisma.reply.create({ data: reply });
  }

  console.log('✅ Created more posts with likes and comments');

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