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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HARDCODED_USER_ID } from "@/lib/constants";

type Props = {
  onHabitCreated: () => void;
};

export default function AddHabitForm({ onHabitCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"DO" | "AVOID">("DO");
  const [period, setPeriod] = useState<"WEEK" | "MONTH">("WEEK");
  const [target, setTarget] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const config =
      type === "DO"
        ? { type: "DO", period, target: Number(target) }
        : { type: "AVOID", threshold: 0 };

    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: HARDCODED_USER_ID,
        name,
        type,
        config,
      }),
    });

    setSubmitting(false);
    setOpen(false);
    setName("");
    setType("DO");
    setPeriod("WEEK");
    setTarget(1);
    onHabitCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>習慣を追加</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新しい習慣</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="habit-name">名前</Label>
            <Input
              id="habit-name"
              placeholder="例: 毎日ランニング"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>タイプ</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as "DO" | "AVOID")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DO">Do（実行する）</SelectItem>
                <SelectItem value="AVOID">Avoid（避ける）</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "DO" && (
            <>
              <div className="space-y-2">
                <Label>期間</Label>
                <Select
                  value={period}
                  onValueChange={(v) => setPeriod(v as "WEEK" | "MONTH")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEK">週</SelectItem>
                    <SelectItem value="MONTH">月</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">目標回数</Label>
                <Input
                  id="target"
                  type="number"
                  min={1}
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "作成中..." : "作成"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
