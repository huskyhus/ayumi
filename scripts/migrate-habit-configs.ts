import "dotenv/config";
import prisma from "../lib/prisma";
import { HabitConfigSchema } from "../lib/domain/habit/habitConfig";

async function migrateHabitConfigs() {
  console.log("Migrating habit configs...\n");

  const habits = await prisma.habit.findMany();
  let updated = 0;
  let skipped = 0;

  for (const habit of habits) {
    const parsed = HabitConfigSchema.safeParse(habit.config);
    if (parsed.success) {
      skipped++;
      continue;
    }

    const defaultConfig =
      habit.type === "DO"
        ? { type: "DO", period: "WEEK", target: 1 }
        : { type: "AVOID", threshold: 0 };

    await prisma.habit.update({
      where: { id: habit.id },
      data: { config: defaultConfig },
    });

    console.log(
      `  Updated: ${habit.name} (${habit.type}) -> ${JSON.stringify(defaultConfig)}`
    );
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped (already valid): ${skipped}`);
}

migrateHabitConfigs().catch(console.error);
