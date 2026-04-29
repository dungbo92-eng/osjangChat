import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAiProvider, type ChatMessage } from "@/lib/ai";
import { buildClosetContext, CHAT_SYSTEM_PROMPT_BASE } from "@/lib/closet-context";
import { fetchWeather, summarizeWeather, dressingHints } from "@/lib/weather";

export const runtime = "nodejs";

interface ChatRequestBody {
  messages: ChatMessage[];
  location?: { lat: number; lon: number } | null;
  place?: string | null;
}

const HISTORY_LIMIT = 20;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const body = (await req.json()) as ChatRequestBody;
  const incoming = body.messages?.filter((m) => m && m.content?.trim()) ?? [];
  const latest = incoming[incoming.length - 1];
  if (!latest || latest.role !== "user") {
    return new Response("마지막 메시지는 user 여야 합니다.", { status: 400 });
  }

  const closet = await buildClosetContext(userId);

  // 날씨 (좌표가 들어왔을 때만)
  let weatherBlock = "";
  if (body.location && Number.isFinite(body.location.lat) && Number.isFinite(body.location.lon)) {
    try {
      const w = await fetchWeather(body.location.lat, body.location.lon, req.signal);
      const hints = dressingHints(w);
      weatherBlock = [
        `\n현재 날씨: ${summarizeWeather(w)}`,
        hints.length ? `드레싱 가이드: ${hints.join(" / ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    } catch (e) {
      console.error("[chat] weather failed:", e);
    }
  }

  const placeBlock = body.place ? `\n장소/일정 컨텍스트: ${body.place}` : "";
  const now = new Date();
  const timeBlock = `\n현재 시각: ${now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`;

  const systemPrompt = [
    CHAT_SYSTEM_PROMPT_BASE,
    "",
    closet,
    weatherBlock + placeBlock + timeBlock,
    "",
    "추천 시 가능하면 사용자가 보유한 옷 안에서 코디 1~3안을 제안하고, 각 안마다 이유 한 줄을 덧붙여라.",
  ]
    .filter(Boolean)
    .join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...incoming.slice(-HISTORY_LIMIT),
  ];

  await prisma.chatMessage.create({
    data: { userId, role: "user", content: latest.content },
  });

  const provider = getAiProvider();
  const encoder = new TextEncoder();
  let assistantBuf = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of provider.chatStream(messages, { signal: req.signal })) {
          assistantBuf += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
        return;
      }
      if (assistantBuf.trim()) {
        prisma.chatMessage
          .create({
            data: { userId, role: "assistant", content: assistantBuf },
          })
          .catch((e) => console.error("[chat] persist assistant failed:", e));
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  await prisma.chatMessage.deleteMany({ where: { userId: session.user.id } });
  return Response.json({ ok: true });
}
