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

type Props = {
  habitId: string;
  habitType: string;
  onEventCreated: () => void;
};

export default function AddEventDialog({
  habitId,
  habitType,
  onEventCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(1);
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const value =
      habitType === "DO" ? { amount: Number(amount) } : { value: 1 };

    await fetch("/api/habit-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        habitId,
        value,
        occurredAt: new Date(occurredAt).toISOString(),
      }),
    });

    setSubmitting(false);
    setOpen(false);
    setAmount(1);
    onEventCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {habitType === "DO" ? "記録する" : "記録する"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {habitType === "DO" ? "実行を記録" : "発生を記録"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {habitType === "DO" && (
            <div className="space-y-2">
              <Label htmlFor="amount">回数</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="occurredAt">日時</Label>
            <Input
              id="occurredAt"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
