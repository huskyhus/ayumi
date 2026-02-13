"use client";

import { useState, useCallback } from "react";
import HabitCard, { type DashboardHabitData } from "./HabitCard";
import AddHabitForm from "./AddHabitForm";
import ThemeToggle from "./ThemeToggle";

type Props = {
  initialHabits: DashboardHabitData[];
};

export default function DashboardClient({ initialHabits }: Props) {
  const [habits, setHabits] = useState<DashboardHabitData[]>(initialHabits);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    if (res.ok) {
      const data = await res.json();
      setHabits(data);
    }
  }, []);

  function handleDelete(id: string) {
    setHabits((s) => s.filter((h) => h.id !== id));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <ThemeToggle />
        <AddHabitForm onHabitCreated={refresh} />
      </div>

      {habits.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          まだ習慣がありません。「習慣を追加」から始めましょう。
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              onDelete={handleDelete}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
