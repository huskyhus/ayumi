"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import type { DashboardHabitEvent } from "./HabitCard";

type Props = {
  event: DashboardHabitEvent;
  habitType: string;
  onUpdated: () => void;
};

export default function EditEventDialog({ event, habitType, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const isDoHabit = habitType === "DO";
  const initialAmount =
    isDoHabit && typeof (event.value as { amount?: number }).amount === "number"
      ? (event.value as { amount: number }).amount
      : 1;
  const [amount, setAmount] = useState(initialAmount);
  const [occurredAt, setOccurredAt] = useState(
    new Date(event.occurredAt).toISOString().slice(0, 16)
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const value = isDoHabit ? { amount: Number(amount) } : { value: 1 };

    await fetch(`/api/habit-events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        value,
        occurredAt: new Date(occurredAt).toISOString(),
      }),
    });

    setSubmitting(false);
    setOpen(false);
    onUpdated();
  }

  async function handleDelete() {
    if (!confirm("このイベントを削除しますか？")) return;
    await fetch(`/api/habit-events/${event.id}`, { method: "DELETE" });
    setOpen(false);
    onUpdated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>イベントを編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          {isDoHabit && (
            <div className="space-y-2">
              <Label htmlFor="edit-amount">回数</Label>
              <Input
                id="edit-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-occurredAt">日時</Label>
            <Input
              id="edit-occurredAt"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>
          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              削除
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
