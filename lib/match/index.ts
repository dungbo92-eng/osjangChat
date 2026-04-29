import type { MatchProvider } from "./types";
import { naverShoppingProvider } from "./naver";
import { musinsaProvider } from "./musinsa";

export const matchProviders: MatchProvider[] = [
  naverShoppingProvider,
  musinsaProvider,
];

export type * from "./types";
export { buildSimilarQuery, buildComplementQuery } from "./query-builder";
