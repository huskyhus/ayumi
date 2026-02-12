import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { HabitConfigSchema } from "@/lib/domain/habit/habitConfig";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, name, type, config } = body;
  if (!userId || !name || !type) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const parsed = HabitConfigSchema.safeParse(config);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid config", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const created = await prisma.habit.create({
    data: {
      userId,
      name,
      type,
      config: parsed.data,
    },
  });

  return NextResponse.json(created);
}
