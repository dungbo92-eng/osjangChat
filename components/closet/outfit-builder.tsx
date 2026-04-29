"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CloseItem {
  id: string;
  imageUrl: string;
  category: string;
}

export function OutfitBuilder({ items }: { items: CloseItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [place, setPlace] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    if (selected.size === 0) {
      setError("아이템을 선택하세요.");
      return;
    }
    setError(null);
    start(async () => {
      const res = await fetch("/api/outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: Array.from(selected),
          contextPlace: place.trim() || null,
          savedToLookbook: true,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || `저장 실패 (${res.status})`);
        return;
      }
      setSelected(new Set());
      setPlace("");
      setOpen(false);
      router.push("/lookbook");
    });
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} disabled={items.length === 0}>
        ✨ 코디 만들기
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">코디 구성 ({selected.size} 선택)</h3>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          닫기
        </Button>
      </div>

      <div className="mb-3 grid max-h-72 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
        {items.map((it) => {
          const isSel = selected.has(it.id);
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => toggle(it.id)}
              className={`relative overflow-hidden rounded border-2 ${
                isSel ? "border-zinc-900 dark:border-zinc-100" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.imageUrl} alt={it.category} className="aspect-square w-full object-cover" />
              {isSel && (
                <span className="absolute right-1 top-1 rounded-full bg-zinc-900 px-1.5 text-[10px] text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Input
        value={place}
        onChange={(e) => setPlace(e.target.value)}
        placeholder="장소/일정 (선택): 예) 강남 저녁약속"
        className="mb-3"
      />

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <Button onClick={save} disabled={pending || selected.size === 0}>
        {pending ? "저장 중…" : "코디북에 저장"}
      </Button>
    </div>
  );
}
