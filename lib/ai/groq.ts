import Groq from "groq-sdk";
import type {
  AiProvider,
  ChatMessage,
  ChatOptions,
  ClothingTags,
  VisionTagInput,
} from "./provider";

const DEFAULT_CHAT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

let _client: Groq | null = null;
function client(): Groq {
  if (_client) return _client;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  _client = new Groq({ apiKey });
  return _client;
}

export const groqProvider: AiProvider = {
  async *chatStream(messages: ChatMessage[], options: ChatOptions = {}) {
    const stream = await client().chat.completions.create(
      {
        model: options.model ?? DEFAULT_CHAT_MODEL,
        temperature: options.temperature ?? 0.7,
        stream: true,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      },
      { signal: options.signal },
    );

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  },

  async tagClothing({ imageUrl, prompt }: VisionTagInput): Promise<ClothingTags> {
    const sys = `너는 옷 이미지를 분석해 구조화된 JSON 으로만 응답하는 분류기다.
출력 스키마:
{"category":"TOP|BOTTOM|OUTER|SHOES|ACC","colors":["string"],"style":["string"],"season":["SPRING|SUMMER|FALL|WINTER"]}
한국어 키워드 사용. 다른 텍스트 절대 출력 금지.`;

    const userPrompt = prompt ?? "이 옷을 분석해서 JSON 으로만 답하세요.";

    const res = await client().chat.completions.create({
      model: DEFAULT_VISION_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    const text = res.choices[0]?.message?.content;
    if (!text) throw new Error("Empty vision response");

    const parsed = JSON.parse(text) as ClothingTags;
    return parsed;
  },
};
