import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { POST } from "../app/api/tests/[id]/submit/route";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  await db.attempt.updateMany({ data: { status: "IN_PROGRESS" } });
  await db.result.deleteMany();

  try {
    const res = await POST(null as any, { params: Promise.resolve({ id: "cmqupt0m9000df82s3742p1o9" }) });
    console.log("Status:", res.status);
    const body = await res.json();
    console.log("Body:", body);
  } catch (err) {
    console.error("Uncaught error:", err);
  }
}
main().finally(() => db.$disconnect());
