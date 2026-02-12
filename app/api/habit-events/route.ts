import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { HabitConfigSchema } from "@/lib/domain/habit/habitConfig";
import { parseHabitEventValue } from "@/lib/domain/habit/habitEvent";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { habitId, value, occurredAt } = body;
  if (!habitId || value === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // Fetch the habit to validate value against its config
  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit) {
    return NextResponse.json({ error: "habit not found" }, { status: 404 });
  }

  const configParsed = HabitConfigSchema.safeParse(habit.config);
  if (configParsed.success) {
    try {
      parseHabitEventValue(configParsed.data, value);
    } catch {
      return NextResponse.json(
        { error: "invalid event value for this habit type" },
        { status: 400 }
      );
    }
  }

  const created = await prisma.habitEvent.create({
    data: {
      habitId,
      value,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    },
  });

  return NextResponse.json(created);
}
