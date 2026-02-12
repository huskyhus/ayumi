import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { HabitConfigSchema } from "@/lib/domain/habit/habitConfig";
import { calculateHabitStats } from "@/lib/domain/habit/evaluate";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const habit = await prisma.habit.findUnique({
    where: { id },
    include: { events: { orderBy: { occurredAt: "asc" } } },
  });

  if (!habit) {
    return NextResponse.json({ error: "habit not found" }, { status: 404 });
  }

  const configParsed = HabitConfigSchema.safeParse(habit.config);
  if (!configParsed.success) {
    return NextResponse.json(
      { error: "invalid habit config", configError: true },
      { status: 422 }
    );
  }

  const events = habit.events.map((e) => ({
    occurredAt: e.occurredAt,
    value: e.value as Record<string, unknown>,
  }));

  const stats = calculateHabitStats(
    configParsed.data,
    events,
    habit.createdAt
  );

  return NextResponse.json(stats);
}
