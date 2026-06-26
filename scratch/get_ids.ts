import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const user = await db.user.findFirst({ where: { email: 'student1@prp.dev' } });
  console.log("USER_ID:", user?.id);
  const attempt = await db.attempt.findFirst({ orderBy: { startedAt: 'desc' }});
  console.log("ATTEMPT_TEST_ID:", attempt?.testId);
}
main().finally(() => db.$disconnect());
