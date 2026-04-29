export type MatchSource = "MUSINSA" | "NAVER";

export interface ExternalMatch {
  source: MatchSource;
  url: string;
  imageUrl: string;
  title: string;
  price?: number;
  brand?: string;
}

export interface MatchProvider {
  source: MatchSource;
  /** 환경변수가 채워져 있어 호출 가능한가 */
  ready(): boolean;
  search(query: string, limit: number): Promise<ExternalMatch[]>;
}
