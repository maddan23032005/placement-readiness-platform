import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });


async function main() {
  console.log("Seeding database...");

  // ── Users ────────────────────────────────────────────────
  const trainerHash = await bcrypt.hash("trainer123", 12);
  const studentHash = await bcrypt.hash("student123", 12);

  const trainer = await db.user.upsert({
    where: { email: "trainer@prp.dev" },
    update: {},
    create: {
      name: "Dr. Priya Sharma",
      email: "trainer@prp.dev",
      passwordHash: trainerHash,
      role: "TRAINER",
      department: "Computer Science",
    },
  });

  const student1 = await db.user.upsert({
    where: { email: "student1@prp.dev" },
    update: {},
    create: {
      name: "Arjun Mehta",
      email: "student1@prp.dev",
      passwordHash: studentHash,
      role: "STUDENT",
      rollNumber: "21CS001",
      branch: "CSE",
      gradYear: 2025,
    },
  });

  const student2 = await db.user.upsert({
    where: { email: "student2@prp.dev" },
    update: {},
    create: {
      name: "Sneha Rao",
      email: "student2@prp.dev",
      passwordHash: studentHash,
      role: "STUDENT",
      rollNumber: "21CS002",
      branch: "CSE",
      gradYear: 2025,
    },
  });

  // ── Batch ────────────────────────────────────────────────
  const batch = await db.batch.upsert({
    where: { id: "batch-cse-2025" },
    update: {},
    create: {
      id: "batch-cse-2025",
      name: "CSE 2025 – Section A",
      trainers: { connect: { id: trainer.id } },
      members: {
        create: [
          { userId: student1.id },
          { userId: student2.id },
        ],
      },
    },
  });

  // ── MCQ Questions ────────────────────────────────────────
  const questions = [
    {
      text: "Which data structure is used to implement a LIFO (Last-In, First-Out) operation?",
      options: ["Queue", "Stack", "Linked List", "Tree"],
      correctOptions: [1],
      topic: "DSA",
      difficulty: "EASY" as const,
    },
    {
      text: "What is the time complexity of Binary Search on a sorted array of n elements?",
      options: ["O(n)", "O(n log n)", "O(log n)", "O(1)"],
      correctOptions: [2],
      topic: "DSA",
      difficulty: "EASY" as const,
    },
    {
      text: "Which SQL clause is used to filter rows AFTER grouping?",
      options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
      correctOptions: [1],
      topic: "DBMS",
      difficulty: "MEDIUM" as const,
    },
    {
      text: "In a relational database, which normal form eliminates transitive dependencies?",
      options: ["1NF", "2NF", "3NF", "BCNF"],
      correctOptions: [2],
      topic: "DBMS",
      difficulty: "MEDIUM" as const,
    },
    {
      text: "Which scheduling algorithm gives the minimum average waiting time for a set of processes?",
      options: ["FCFS", "Round Robin", "SJF (non-preemptive)", "Priority Scheduling"],
      correctOptions: [2],
      topic: "OS",
      difficulty: "MEDIUM" as const,
    },
    {
      text: "What is the worst-case time complexity of QuickSort?",
      options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
      correctOptions: [1],
      topic: "DSA",
      difficulty: "MEDIUM" as const,
    },
    {
      text: "A train travels 360 km in 4 hours. How long will it take to travel 540 km at the same speed?",
      options: ["5 hours", "5.5 hours", "6 hours", "6.5 hours"],
      correctOptions: [2],
      topic: "Aptitude",
      difficulty: "EASY" as const,
    },
    {
      text: "What does the 'S' in SOLID principles stand for?",
      options: ["Segregation", "Single Responsibility", "Substitution", "Simplicity"],
      correctOptions: [1],
      topic: "OOP",
      difficulty: "EASY" as const,
    },
    {
      text: "In TCP/IP, which layer is responsible for end-to-end communication and error recovery?",
      options: ["Network layer", "Data Link layer", "Transport layer", "Application layer"],
      correctOptions: [2],
      topic: "Networks",
      difficulty: "MEDIUM" as const,
    },
    {
      text: "What is the output of: SELECT COUNT(*) FROM employees WHERE salary > 50000 AND department = 'IT'?",
      options: [
        "It returns the total number of rows in the employees table",
        "It returns the number of IT employees earning more than 50,000",
        "It returns the sum of salaries",
        "It returns NULL if no rows match",
      ],
      correctOptions: [1],
      topic: "SQL",
      difficulty: "HARD" as const,
    },
  ];

  const createdQuestions = [];
  for (const q of questions) {
    const existing = await db.questionMCQ.findFirst({ where: { text: q.text } });
    if (!existing) {
      const created = await db.questionMCQ.create({
        data: { ...q, tags: [], createdById: trainer.id },
      });
      createdQuestions.push(created);
    } else {
      createdQuestions.push(existing);
    }
  }

  // ── Demo Test ────────────────────────────────────────────
  const existingTest = await db.test.findFirst({ where: { title: "Placement Mock Test 1" } });
  if (!existingTest) {
    const test = await db.test.create({
      data: {
        title: "Placement Mock Test 1",
        description: "A mixed-topic test covering DSA, DBMS, OS, and Aptitude.",
        durationMins: 30,
        negativeMarking: true,
        negativeValue: 0.25,
        status: "PUBLISHED",
        createdById: trainer.id,
        batches: { create: [{ batchId: batch.id }] },
        questions: {
          create: createdQuestions.slice(0, 8).map((q, i) => ({
            questionId: q.id,
            marks: 1,
            order: i,
          })),
        },
      },
    });
    console.log("Created demo test:", test.title);
  }

  console.log("Seed complete!");
  console.log("\nDemo credentials:");
  console.log("  Trainer — trainer@prp.dev / trainer123");
  console.log("  Student — student1@prp.dev / student123");
  console.log("  Student — student2@prp.dev / student123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
