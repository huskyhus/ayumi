import { z } from "zod";
import { HabitConfig } from "./habitConfig";
import { HabitKind } from "./habitTypes";

export const DoHabitEventValueSchema = z.object({
  amount: z.number().positive(),
});

export const AvoidHabitEventValueSchema = z.object({
  value: z.number(),
});

export function parseHabitEventValue(config: HabitConfig, value: unknown) {
  switch (config.type) {
    case HabitKind.DO:
      return DoHabitEventValueSchema.parse(value);
    case HabitKind.AVOID:
      return AvoidHabitEventValueSchema.parse(value);
  }
}
