// Provider-agnostic AI interface.
// Default: GroqProvider (chat + vision) + ClipProvider (embed, Phase 4 에서 구현)
// Swap by changing `getAiProvider()` 만.

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
}

export interface VisionTagInput {
  imageUrl: string;        // remote URL or data URL
  prompt?: string;
}

// Phase 4 에서 채워질 자동 태깅 결과 스키마
export interface ClothingTags {
  category: "TOP" | "BOTTOM" | "OUTER" | "SHOES" | "ACC";
  colors: string[];
  style: string[];
  season: string[];
}

export interface AiProvider {
  /** Streamed chat completion. Returns an AsyncIterable of token chunks. */
  chatStream(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncIterable<string>;

  /** Vision call returning structured clothing tags. */
  tagClothing(input: VisionTagInput): Promise<ClothingTags>;
}

export interface EmbedProvider {
  /** Returns a fixed-length CLIP-style embedding for an image. */
  embedImage(imageUrl: string): Promise<number[]>;
  /** Returns a fixed-length embedding for a text query. */
  embedText(text: string): Promise<number[]>;
}
