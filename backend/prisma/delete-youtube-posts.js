const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT id, "mediaUrl", "mediaType" FROM "Post"
    WHERE "mediaUrl" LIKE '%youtube.com%' OR "mediaUrl" LIKE '%youtu.be%'
  `;

  console.log('Posts with YouTube links:', result.length);

  for (const post of result) {
    console.log(`Deleting post ${post.id}: ${post.mediaUrl}`);
  }

  await prisma.$executeRaw`
    DELETE FROM "Post"
    WHERE "mediaUrl" LIKE '%youtube.com%' OR "mediaUrl" LIKE '%youtu.be%'
  `;

  console.log('Deleted successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());