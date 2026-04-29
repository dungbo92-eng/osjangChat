"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Role = "user" | "assistant" | "system";
interface Msg {
  id: string;
  role: Role;
  content: string;
}
interface Coords {
  lat: number;
  lon: number;
}
export interface ItemSummary {
  id: string;
  imageUrl: string;
  category: string;
  colors: string[];
}

const ITEM_REF_RE = /\[item:([a-z0-9]+)\]/gi;

const CATEGORY_LABEL: Record<string, string> = {
  TOP: "상의",
  BOTTOM: "하의",
  OUTER: "외투",
  SHOES: "신발",
  ACC: "악세서리",
};

function extractItemIds(content: string): string[] {
  const ids: string[] = [];
  for (const m of content.matchAll(ITEM_REF_RE)) {
    ids.push(m[1]);
  }
  return Array.from(new Set(ids));
}

export function ChatView({
  initial,
  itemMap,
}: {
  initial: Msg[];
  itemMap: Record<string, ItemSummary>;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [coords, setCoords] = useState<Coords | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "denied" | "ok">("idle");
  const [place, setPlace] = useState("");

  function requestLocation() {
    if (!navigator.geolocation) return setLocStatus("denied");
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocStatus("ok");
      },
      () => setLocStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    setInput("");

    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content: text };
    const aId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, userMsg, { id: aId, role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
          location: coords,
          place: place.trim() || null,
        }),
      });
      if (!res.ok || !res.body) throw new Error(`서버 오류 (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === aId ? { ...m, content: m.content + chunk } : m)),
        );
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "오류");
      setMessages((prev) => prev.filter((m) => m.id !== aId));
    } finally {
      setStreaming(false);
    }
  }

  function onClear() {
    if (!confirm("전체 대화를 삭제할까요?")) return;
    startTransition(async () => {
      await fetch("/api/chat", { method: "DELETE" });
      setMessages([]);
      router.refresh();
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h1 className="text-lg font-semibold">채팅</h1>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            대화 초기화
          </Button>
        )}
      </header>

      <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 text-xs">
          {locStatus === "ok" && coords ? (
            <span className="rounded-full bg-green-100 px-2 py-1 text-green-800 dark:bg-green-950 dark:text-green-300">
              📍 위치 ON ({coords.lat.toFixed(2)}, {coords.lon.toFixed(2)})
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={requestLocation}
              disabled={locStatus === "loading"}
            >
              {locStatus === "loading"
                ? "위치 확인 중…"
                : locStatus === "denied"
                  ? "위치 거부됨 — 다시 시도"
                  : "📍 현재 위치 사용 (날씨 반영)"}
            </Button>
          )}
          <Input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="장소/일정 (선택): 예) 강남 저녁약속"
            className="h-8 w-72 text-xs"
          />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center text-sm text-zinc-500">
            <p className="mb-2 text-base font-medium text-zinc-700 dark:text-zinc-300">
              옷장과 대화를 시작하세요.
            </p>
            <p>예: &quot;오늘 카페 갈건데 뭐 입지?&quot; (위치 ON 시 날씨 자동 반영)</p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((m) => (
              <Bubble
                key={m.id}
                role={m.role}
                content={m.content}
                streaming={streaming && m.role === "assistant" && m.content === ""}
                itemMap={itemMap}
                place={place}
                coords={coords}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="메시지를 입력… (Enter 전송, Shift+Enter 줄바꿈)"
            className="min-h-10 max-h-40 flex-1 resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
          />
          <Button onClick={send} disabled={streaming || !input.trim()}>
            {streaming ? "응답 중…" : "전송"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  role,
  content,
  streaming,
  itemMap,
  place,
  coords,
}: {
  role: Role;
  content: string;
  streaming?: boolean;
  itemMap: Record<string, ItemSummary>;
  place: string;
  coords: Coords | null;
}) {
  const isUser = role === "user";

  // 마커 파싱하여 텍스트와 아이템 칩을 인라인으로 분리 렌더
  const segments = useMemo(() => {
    if (isUser) return null;
    const out: Array<{ kind: "text"; text: string } | { kind: "item"; id: string }> = [];
    let last = 0;
    for (const m of content.matchAll(ITEM_REF_RE)) {
      const start = m.index ?? 0;
      if (start > last) out.push({ kind: "text", text: content.slice(last, start) });
      out.push({ kind: "item", id: m[1] });
      last = start + m[0].length;
    }
    if (last < content.length) out.push({ kind: "text", text: content.slice(last) });
    return out;
  }, [content, isUser]);

  const refIds = useMemo(() => (isUser ? [] : extractItemIds(content)), [content, isUser]);
  const validItems = refIds.map((id) => itemMap[id]).filter(Boolean) as ItemSummary[];

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-3">
        <div className="whitespace-pre-wrap rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
          {streaming ? (
            <span className="inline-block animate-pulse">…</span>
          ) : (
            segments?.map((seg, i) =>
              seg.kind === "text" ? (
                <Fragment key={i}>{seg.text}</Fragment>
              ) : (
                <InlineItemChip key={i} item={itemMap[seg.id]} />
              ),
            )
          )}
        </div>
        {validItems.length > 0 && !streaming && (
          <SaveOutfitBar items={validItems} place={place} coords={coords} />
        )}
      </div>
    </div>
  );
}

function InlineItemChip({ item }: { item?: ItemSummary }) {
  if (!item) return <span className="text-zinc-500">[삭제된 아이템]</span>;
  return (
    <span className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-1.5 py-0.5 align-middle text-[11px] dark:border-zinc-700 dark:bg-zinc-950">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.imageUrl} alt={item.category} className="h-4 w-4 rounded-sm object-cover" />
      <span className="font-medium">{CATEGORY_LABEL[item.category] || item.category}</span>
    </span>
  );
}

function SaveOutfitBar({
  items,
  place,
  coords,
}: {
  items: ItemSummary[];
  place: string;
  coords: Coords | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: items.map((i) => i.id),
          contextPlace: place || null,
          contextWeather: coords ? { lat: coords.lat, lon: coords.lon } : null,
          savedToLookbook: true,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `저장 실패 (${res.status})`);
      }
      setSaved(true);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex -space-x-2">
        {items.slice(0, 4).map((it) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={it.id}
            src={it.imageUrl}
            alt={it.category}
            className="h-8 w-8 rounded-full border-2 border-white object-cover dark:border-zinc-950"
          />
        ))}
      </div>
      <span className="flex-1 text-zinc-500">추천된 {items.length}개 아이템</span>
      {saved ? (
        <span className="text-green-600">✓ 저장됨</span>
      ) : (
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "저장 중…" : "이 코디 저장"}
        </Button>
      )}
      {err && <span className="text-red-600">{err}</span>}
    </div>
  );
}
