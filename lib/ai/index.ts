import type { AiProvider, EmbedProvider } from "./provider";
import { groqProvider } from "./groq";

// Phase 4 에서 ClipProvider 구현 후 교체.
const clipStub: EmbedProvider = {
  async embedImage() {
    throw new Error("Embed provider not implemented yet (Phase 4).");
  },
  async embedText() {
    throw new Error("Embed provider not implemented yet (Phase 4).");
  },
};

export function getAiProvider(): AiProvider {
  return groqProvider;
}

export function getEmbedProvider(): EmbedProvider {
  return clipStub;
}

export type * from "./provider";
