import { z } from "zod";

export const signupSchema = z.object({
  name:        z.string().min(2),
  email:       z.string().email(),
  password:    z.string().min(8),
  role:        z.enum(["STUDENT", "TRAINER"]),
  rollNumber:  z.string().optional(),
  branch:      z.string().optional(),
  gradYear:    z.number().int().optional(),
  department:  z.string().optional(),
});

export const mcqQuestionSchema = z.object({
  text:           z.string().min(5),
  options:        z.array(z.string().min(1)).min(2),
  correctOptions: z.array(z.number().int().min(0)).min(1),
  topic:          z.string().min(1),
  difficulty:     z.enum(["EASY", "MEDIUM", "HARD"]),
  tags:           z.array(z.string()).optional().default([]),
});

export const createTestSchema = z.object({
  title:          z.string().min(3),
  description:    z.string().optional(),
  durationMins:   z.number().int().min(1),
  startAt:        z.string().optional(),
  endAt:          z.string().optional(),
  negativeMarking:z.boolean().default(false),
  negativeValue:  z.number().min(0).default(0.25),
  batchIds:       z.array(z.string()),
  questions:      z.array(z.object({
    questionId: z.string(),
    marks:      z.number().min(0.5),
    order:      z.number().int().min(0),
  })),
});

export const autosaveSchema = z.object({
  questionId:      z.string(),
  selectedOptions: z.array(z.number().int().min(0)),
});

export const batchSchema = z.object({
  name: z.string().min(2, "Batch name must be at least 2 characters"),
});

