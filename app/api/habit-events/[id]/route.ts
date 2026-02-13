import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { HabitConfigSchema } from "@/lib/domain/habit/habitConfig";
import { parseHabitEventValue } from "@/lib/domain/habit/habitEvent";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.habitEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { value, occurredAt } = body;

  const event = await prisma.habitEvent.findUnique({
    where: { id },
    include: { habit: true },
  });
  if (!event) {
    return NextResponse.json({ error: "event not found" }, { status: 404 });
  }

  // Validate value against habit config if provided
  if (value !== undefined) {
    const configParsed = HabitConfigSchema.safeParse(event.habit.config);
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
  }

  const data: Record<string, unknown> = {};
  if (value !== undefined) data.value = value;
  if (occurredAt !== undefined) data.occurredAt = new Date(occurredAt);

  const updated = await prisma.habitEvent.update({
    where: { id },
    data: data as { value?: object; occurredAt?: Date },
  });
  return NextResponse.json(updated);
}
