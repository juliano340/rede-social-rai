const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Limpando dados existentes...');
  await prisma.notification.deleteMany();
  await prisma.like.deleteMany();
  await prisma.reply.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('123456', 10);
  const now = new Date();

  const users = [
    { username: 'veraveridito', email: 'vera@rai.com', password: hash, name: 'Vera Veridito', bio: 'Jornalista investigativa. A verdade sempre vem à tona.' },
    { username: 'bentosabino', email: 'bento@rai.com', password: hash, name: 'Bento Sabino', bio: 'Professor de filosofia. Saber é poder.' },
    { username: 'claraluz', email: 'clara@rai.com', password: hash, name: 'Clara Luz', bio: 'Fotógrafa e viajante. O mundo é meu estúdio.' },
    { username: 'ottomarques', email: 'otto@rai.com', password: hash, name: 'Otto Marques', bio: 'Chef de cozinha. Nada como uma boa refeição.' },
    { username: 'luciamontes', email: 'lucia@rai.com', password: hash, name: 'Lúcia Montes', bio: 'Escritora e poeta. Palavras têm poder.' },
    { username: 'fabiorocha', email: 'fabio@rai.com', password: hash, name: 'Fábio Rocha', bio: 'Dev fullstack. Código limpo, café quente.' },
  ];

  const created = [];
  for (const u of users) {
    const user = await prisma.user.create({ data: u });
    created.push(user);
    console.log(`  ${user.name} (@${user.username}) criado`);
  }

  const posts = [
    { content: 'Acabo de descobrir que a verdade tem mais camadas que uma cebola. E dói do mesmo jeito quando você corta.', authorId: created[0].id, createdAt: new Date(now.getTime() - 3600000 * 2) },
    { content: 'Será que a liberdade de expressão existe de verdade ou é só um mito que a gente conta pra si mesmo?', authorId: created[0].id, createdAt: new Date(now.getTime() - 3600000 * 1) },
    { content: 'O que é o belo? Uma questão que atormenta filósofos há milênios.', authorId: created[1].id, createdAt: new Date(now.getTime() - 3600000 * 5) },
    { content: 'Sócrates tinha razão: só sei que nada sei. Quanto mais estudo, menos eu sei.', authorId: created[1].id, createdAt: new Date(now.getTime() - 3600000 * 3) },
    { content: 'Nascer do sol na serra hoje. Algumas coisas a câmera nunca vai capturar.', authorId: created[2].id, createdAt: new Date(now.getTime() - 3600000 * 4) },
    { content: 'Registro do dia: encontrei um café escondido no centro velho. O cheiro já valeu a caminhada.', authorId: created[2].id, createdAt: new Date(now.getTime() - 3600000 * 0.5) },
    { content: 'Segredo do meu ragu: deixar cozinhar por 6 horas. Pressa é inimiga do sabor.', authorId: created[3].id, createdAt: new Date(now.getTime() - 3600000 * 8) },
    { content: 'O mercado hoje me surpreendeu. Encontrei ingredientes que não via desde a infância.', authorId: created[3].id, createdAt: new Date(now.getTime() - 3600000 * 6) },
    { content: 'Um poema não se escreve. Um poema se descobre, escondido entre as palavras do dia a dia.', authorId: created[4].id, createdAt: new Date(now.getTime() - 3600000 * 12) },
    { content: 'Chuva fina no telhado. O melhor som para escrever.', authorId: created[4].id, createdAt: new Date(now.getTime() - 3600000 * 0.2) },
    { content: 'Refatorei o sistema ontem. 2000 linhas viram 800. Que sensação boa.', authorId: created[5].id, createdAt: new Date(now.getTime() - 3600000 * 10) },
    { content: 'Produção caiu. O famoso "funciona na minha máquina". #dejavu', authorId: created[5].id, createdAt: new Date(now.getTime() - 3600000 * 7) },
  ];

  for (const p of posts) {
    await prisma.post.create({ data: p });
  }
  console.log(`\n${posts.length} posts criados`);

  await prisma.follow.create({ data: { followerId: created[0].id, followingId: created[1].id } });
  await prisma.follow.create({ data: { followerId: created[0].id, followingId: created[2].id } });
  await prisma.follow.create({ data: { followerId: created[1].id, followingId: created[0].id } });
  await prisma.follow.create({ data: { followerId: created[2].id, followingId: created[0].id } });
  await prisma.follow.create({ data: { followerId: created[2].id, followingId: created[4].id } });
  await prisma.follow.create({ data: { followerId: created[3].id, followingId: created[5].id } });
  await prisma.follow.create({ data: { followerId: created[4].id, followingId: created[0].id } });
  await prisma.follow.create({ data: { followerId: created[4].id, followingId: created[2].id } });
  await prisma.follow.create({ data: { followerId: created[5].id, followingId: created[3].id } });
  await prisma.follow.create({ data: { followerId: created[5].id, followingId: created[1].id } });
  console.log('Follows criados');

  console.log('\n✅ Seed completo!');
  console.log('📧 Todos usam senha: 123456');
  console.log('👤 Usuários:');
  for (const u of created) {
    console.log(`   @${u.username} - ${u.name}`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });