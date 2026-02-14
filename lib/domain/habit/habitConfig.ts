import { z } from "zod";
import { HabitKind } from "./habitTypes";

export const DoHabitConfigSchema = z.object({
  type: z.literal(HabitKind.DO),
  period: z.enum(["WEEK", "MONTH"]),
  target: z.number().int().positive(),
});

export const AvoidHabitConfigSchema = z.object({
  type: z.literal(HabitKind.AVOID),
  threshold: z.number(),
});

export const HabitConfigSchema = z.discriminatedUnion("type", [
  DoHabitConfigSchema,
  AvoidHabitConfigSchema,
]);

export type HabitConfig = z.infer<typeof HabitConfigSchema>;
