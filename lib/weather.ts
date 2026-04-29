// Open-Meteo: 무료 + API 키 불필요.
// https://open-meteo.com/en/docs

export interface WeatherSnapshot {
  tempC: number;
  tempMinC: number;
  tempMaxC: number;
  precipMm: number;          // 1h precipitation
  windKph: number;
  weatherCode: number;       // WMO code
  description: string;       // 한국어
  timezone: string;
}

const WMO_KO: Record<number, string> = {
  0: "맑음",
  1: "대체로 맑음",
  2: "구름 조금",
  3: "흐림",
  45: "안개",
  48: "짙은 안개",
  51: "약한 이슬비",
  53: "이슬비",
  55: "강한 이슬비",
  61: "약한 비",
  63: "비",
  65: "강한 비",
  71: "약한 눈",
  73: "눈",
  75: "강한 눈",
  77: "싸락눈",
  80: "약한 소나기",
  81: "소나기",
  82: "강한 소나기",
  85: "약한 눈 소나기",
  86: "강한 눈 소나기",
  95: "뇌우",
  96: "뇌우 (약한 우박)",
  99: "뇌우 (강한 우박)",
};

export async function fetchWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "temperature_2m,precipitation,wind_speed_10m,weather_code",
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("forecast_days", "1");

  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const j = (await res.json()) as {
    timezone: string;
    current: {
      temperature_2m: number;
      precipitation: number;
      wind_speed_10m: number;
      weather_code: number;
    };
    daily: {
      temperature_2m_max: number[];
      temperature_2m_min: number[];
    };
  };

  const code = j.current.weather_code;
  return {
    tempC: j.current.temperature_2m,
    tempMinC: j.daily.temperature_2m_min[0],
    tempMaxC: j.daily.temperature_2m_max[0],
    precipMm: j.current.precipitation,
    windKph: j.current.wind_speed_10m,
    weatherCode: code,
    description: WMO_KO[code] ?? `날씨코드 ${code}`,
    timezone: j.timezone,
  };
}

/** LLM system prompt 용 한국어 한 줄 요약 */
export function summarizeWeather(w: WeatherSnapshot): string {
  const parts = [
    `현재 ${w.tempC.toFixed(0)}°C (${w.description})`,
    `최저 ${w.tempMinC.toFixed(0)}°C / 최고 ${w.tempMaxC.toFixed(0)}°C`,
  ];
  if (w.precipMm > 0) parts.push(`강수 ${w.precipMm}mm`);
  if (w.windKph > 15) parts.push(`바람 ${w.windKph.toFixed(0)}km/h`);
  return parts.join(", ");
}

/** 룰 기반 1차 가이드라인 */
export function dressingHints(w: WeatherSnapshot): string[] {
  const hints: string[] = [];
  const t = w.tempC;
  if (t <= 0) hints.push("외투 필수 (패딩/롱코트 권장)");
  else if (t <= 8) hints.push("두꺼운 외투 권장");
  else if (t <= 16) hints.push("가벼운 외투 권장");
  else if (t <= 22) hints.push("긴팔 한 장 적당");
  else if (t <= 27) hints.push("반팔 적당");
  else hints.push("얇고 통기성 좋은 옷 권장");

  if (w.precipMm >= 0.5) hints.push("비/눈 — 방수 외투/우산 고려");
  if (w.windKph >= 25) hints.push("바람 강함 — 바람막이 고려");
  if (w.tempMaxC - w.tempMinC >= 10) hints.push("일교차 큼 — 레이어드 추천");
  return hints;
}
