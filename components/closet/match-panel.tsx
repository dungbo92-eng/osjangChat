"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExternalMatch {
  source: "MUSINSA" | "NAVER";
  url: string;
  imageUrl: string;
  title: string;
  price?: number;
  brand?: string;
}

interface MatchResponse {
  query?: string;
  targetCategory?: string;
  results?: ExternalMatch[];
  error?: string;
  errors?: { source: string; message: string }[];
}

export function MatchPanel({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"similar" | "complement">("complement");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MatchResponse | null>(null);

  async function search(nextMode: "similar" | "complement") {
    setMode(nextMode);
    setLoading(true);
    setData(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, mode: nextMode, limit: 6 }),
      });
      const j: MatchResponse = await res.json();
      setData(j);
    } catch (e) {
      setData({ error: e instanceof Error ? e.message : "오류" });
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-center"
        onClick={() => {
          setOpen(true);
          search("complement");
        }}
      >
        🔗 매칭 찾기
      </Button>
    );
  }

  return (
    <div className="space-y-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
      <div className="flex gap-1">
        <Button
          size="sm"
          variant={mode === "complement" ? "default" : "outline"}
          className="flex-1 text-[11px]"
          onClick={() => search("complement")}
          disabled={loading}
        >
          어울리는
        </Button>
        <Button
          size="sm"
          variant={mode === "similar" ? "default" : "outline"}
          className="flex-1 text-[11px]"
          onClick={() => search("similar")}
          disabled={loading}
        >
          비슷한
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          ×
        </Button>
      </div>

      {loading && <p className="text-center text-[11px] text-zinc-500">검색 중…</p>}

      {data?.error && (
        <p className="text-[11px] text-red-600">{data.error}</p>
      )}

      {data?.query && (
        <p className="truncate text-[10px] text-zinc-500">검색어: {data.query}</p>
      )}

      {data?.results && data.results.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {data.results.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="overflow-hidden rounded border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.imageUrl} alt={r.title} className="aspect-square w-full object-cover" />
              <div className="p-1.5 text-[10px]">
                <div className="line-clamp-2 leading-tight">{r.title}</div>
                {r.price && <div className="mt-0.5 font-medium">₩{r.price.toLocaleString()}</div>}
              </div>
            </a>
          ))}
        </div>
      )}

      {data?.results && data.results.length === 0 && !data.error && (
        <p className="text-center text-[11px] text-zinc-500">결과 없음</p>
      )}
    </div>
  );
}
