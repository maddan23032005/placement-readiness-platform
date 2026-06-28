Placement Readiness Platform

A test-and-evaluate platform built for trainers and students preparing for placements — create MCQ and coding assessments, let students attempt them, and get results back the moment they submit instead of days later.

This started from a simple frustration: manually grading test papers and coding submissions for a whole batch of students doesn't scale, and the gap between "test taken" and "feedback received" is where most of the learning value gets lost. This platform exists to close that gap.


What it actually does

For trainers


Build a question bank tagged by topic and difficulty, mixing MCQs and coding problems
Create a test in a few steps: pick questions, set marks and negative marking, assign to a batch, publish
Watch results come in live, and see a breakdown of which questions the batch struggled with — not just who scored what


For students


Take a test in a focused, full-screen view with a timer and autosave, so a bad refresh doesn't cost an attempt
Write and run code directly in the browser (Monaco editor — the same engine VS Code uses), test against sample cases, then submit for full grading
Get your score the instant grading finishes, with a topic-wise breakdown of where you're actually strong or weak


Evaluation, specifically


MCQs are graded server-side the moment you submit — no waiting
Code is run in an isolated sandbox (via the Piston API) against hidden test cases, so submitted code never executes on the app server itself



Tech stack

LayerChoiceFrameworkNext.js (App Router) + TypeScriptStylingTailwind CSSCode editorMonaco Editor (@monaco-editor/react)DatabasePostgreSQL, via Prisma ORMAuthNextAuth.jsCode executionPiston API (sandboxed, multi-language)HostingVercel (app) + Neon (database)

Why these specifically: Next.js and Prisma share TypeScript end to end so the same types flow from the database to the UI without re-declaring them. Piston was chosen over rolling a custom sandbox because correctly isolating arbitrary student code is a genuinely hard problem that's already been solved well — no reason to redo it.


Running it locally

Prerequisites: Node.js 18+, Docker (for a local Postgres instance), npm.

1. Clone and install

bashgit clone https://github.com/maddan23032005/placement-readiness-platform.git
cd placement-readiness-platform
npm install

2. Start a local database

bashdocker run --name prp-postgres \
  -e POSTGRES_USER=prp_user \
  -e POSTGRES_PASSWORD=prp_password \
  -e POSTGRES_DB=prp_db \
  -p 5432:5432 \
  -d postgres:16

3. Set up your environment file

Create a .env file in the project root:

envDATABASE_URL="postgresql://prp_user:prp_password@localhost:5432/prp_db"
AUTH_SECRET="generate-your-own-random-string-here"
NEXTAUTH_SECRET="same-value-as-AUTH_SECRET-above"
NEXTAUTH_URL="http://localhost:3000"

Generate a real secret rather than typing something memorable:

bashnode -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

4. Apply the database schema

bashnpx prisma migrate dev

5. Run it

bashnpm run dev

Open http://localhost:3000.


Environment variables reference

VariableWhat it's forNotesDATABASE_URLPostgres connection stringUse a pooled connection string in production (Neon, Supabase, etc.)AUTH_SECRETSigns auth sessionsMust be a real random value, never reused between environmentsNEXTAUTH_SECRETSame purpose, used by NextAuth specificallyKeep identical to AUTH_SECRETNEXTAUTH_URLThe app's own public URLhttp://localhost:3000 locally; your real deployed domain in production


Deployment

Currently deployed on Vercel, with the database hosted on Neon.

A couple of things that weren't obvious the first time through, worth noting here so they don't get rediscovered the hard way:


Database migrations need the direct (non-pooled) connection string — pooled connections don't support what prisma migrate deploy needs. The running app, on the other hand, should use the pooled string.
Production builds run a full TypeScript check that local dev mode skips. Code that runs fine with npm run dev can still fail npm run build — always run a real production build locally before pushing if you've touched shared components.
Some networks (notably several college/office WiFi setups) block outbound connections on Postgres's default port. If a migration command hangs or fails to connect, that's usually a network restriction, not a credentials problem — try a different network before debugging further.

Honest limitations, right now


Code execution runs through Piston's free public API, which is fine for development and moderate use but isn't built for guaranteeing uptime under heavy concurrent load. Before relying on this for a real, high-stakes live test with many simultaneous submissions, a self-hosted Piston or Judge0 instance is the safer call.
Proctoring is minimal to non-existent at this stage — there's no tab-switch detection or webcam monitoring yet.
Reporting is currently in-app only; exporting results to PDF/Excel for placement-cell records isn't built yet.


None of this is hidden because it's embarrassing — it's just genuinely where the project is right now, and worth knowing before depending on it for something important.


Roadmap


 Lightweight proctoring (tab-switch detection, optional webcam snapshots)
 Practice mode with adaptive, topic-based recommendations
 Result export to PDF/Excel for placement-cell reporting
 Mock interview scheduling and feedback
 Resume builder with ATS-readiness scoring
 Company drive tracker with eligibility filtering



Acknowledgments

This project leans on some genuinely excellent open-source work: Piston for sandboxed code execution, Monaco Editor for the in-browser coding experience, and Prisma for making the database layer far less painful than it has any right to be.
