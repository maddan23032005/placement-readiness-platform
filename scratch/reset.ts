import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  await db.attempt.updateMany({ data: { status: "IN_PROGRESS" } });
  await db.result.deleteMany();
}
main().finally(() => db.$disconnect());
