const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('test123', 10);

  const u1 = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: { username: 'alice', email: 'alice@rai.com', password: hash, name: 'Alice Silva', bio: 'Desenvolvedora Frontend' }
  });

  const u2 = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: { username: 'bob', email: 'bob@rai.com', password: hash, name: 'Bob Santos', bio: 'Backend Developer' }
  });

  const u3 = await prisma.user.upsert({
    where: { username: 'carla' },
    update: {},
    create: { username: 'carla', email: 'carla@rai.com', password: hash, name: 'Carla Oliveira', bio: 'UX Designer' }
  });

  console.log('Users:', u1.username, u2.username, u3.username);

  await prisma.post.create({ data: { content: 'Primeira post no RAI! 🚀', authorId: u1.id } });
  await prisma.post.create({ data: { content: 'NestJS é demais! 🔥', authorId: u2.id } });
  await prisma.post.create({ data: { content: 'Design é tudo! 🎨', authorId: u3.id } });
  console.log('Posts created');

  await prisma.follow.create({ data: { followerId: u1.id, followingId: u2.id } });
  await prisma.follow.create({ data: { followerId: u2.id, followingId: u1.id } });
  await prisma.follow.create({ data: { followerId: u3.id, followingId: u1.id } });
  console.log('Follows created');

  await prisma.$disconnect();
}

main().catch(console.error);