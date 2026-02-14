export const HabitKind = {
  DO: "DO",
  AVOID: "AVOID",
} as const;

export type HabitKind = (typeof HabitKind)[keyof typeof HabitKind];
