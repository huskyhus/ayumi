import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { HabitConfigSchema } from "@/lib/domain/habit/habitConfig";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.habit.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    data.name = body.name;
  }

  if (body.config !== undefined) {
    const parsed = HabitConfigSchema.safeParse(body.config);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid config", details: parsed.error.issues },
        { status: 400 }
      );
    }
    data.config = parsed.data;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.habit.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
