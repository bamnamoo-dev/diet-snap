// Vercel Serverless Function: /api/analyze (보안 강화 버전)

declare const process: { env: { [key: string]: string | undefined } };

export const config = {
  runtime: 'edge',
};

// 최대 허용 페이로드: 약 5MB (Base64 인코딩 시 약 7MB)
const MAX_BASE64_LENGTH = 7 * 1024 * 1024;

// 엣지 인메모리 IP별 슬라이딩 윈도우 레이트 리미터 (1분당 최대 10회)
const ipRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // 메모리 누수 방지 (맵 크기가 1000개를 넘어가면 만료된 항목 일괄 정리)
  if (ipRateLimitMap.size > 1000) {
    for (const [key, value] of ipRateLimitMap.entries()) {
      if (now > value.resetTime) {
        ipRateLimitMap.delete(key);
      }
    }
  }

  const record = ipRateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    ipRateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * 허용된 Origin 인지 검증 (도용 및 무단 Hotlinking 방어)
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) {
    // PWA 독립실행 모드 또는 브라우저 Same-Origin 요청 시 origin 헤더가 비어있을 수 있음
    return true;
  }
  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // 1. 로컬 개발 환경 허용
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    // 2. 공식 배포 및 DietSnap Vercel 프리뷰 도메인만 엄격히 허용
    if (
      hostname === 'diet-snap.vercel.app' || 
      (hostname.startsWith('diet-snap-') && hostname.endsWith('.vercel.app'))
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export default async function handler(req: Request) {
  const origin = req.headers.get('origin');

  // CORS 프리플라이트 요청 처리
  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-dietsnap-client',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 1. Origin 검증: 승인되지 않은 외부 도메인의 무단 호출 차단
  if (!isAllowedOrigin(origin)) {
    return new Response(
      JSON.stringify({ error: '접근이 거부되었습니다. 승인되지 않은 출처입니다.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 2. HTTP Method 검증
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. IP 기반 레이트 리미팅 검사 (무차별 폭탄 호출 / DoS 차단)
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown-client';

  if (clientIp !== 'unknown-client' && !checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: '단시간에 너무 많은 요청이 발생했습니다. 1분 후 다시 시도해주세요.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      }
    );
  }

  // 4. Content-Length 사전 검사 (대용량 공격 차단)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BASE64_LENGTH) {
    return new Response(
      JSON.stringify({ error: '이미지 용량이 너무 큽니다. (최대 5MB 허용)' }),
      {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (origin && isAllowedOrigin(origin)) {
    responseHeaders['Access-Control-Allow-Origin'] = origin;
  }

  try {
    const body = await req.json().catch(() => null);
    const imageBase64 = body?.imageBase64;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: '유효한 이미지 데이터가 필요합니다.' }),
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }

    // 5. 문자열 길이 재검증 (DoS 방지)
    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return new Response(
        JSON.stringify({ error: '이미지 용량이 너무 큽니다. (최대 5MB 허용)' }),
        {
          status: 413,
          headers: responseHeaders,
        }
      );
    }

    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();

    if (!cleanBase64 || cleanBase64.length < 50) {
      return new Response(
        JSON.stringify({ error: '손상되었거나 유효하지 않은 이미지입니다.' }),
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = 'gemini-3.5-flash-lite';

    if (!apiKey) {
      console.error('[API/Analyze] GEMINI_API_KEY is missing in server environment');
      return new Response(
        JSON.stringify({ error: 'AI 분석 서버 환경설정 오류입니다. 관리자에게 문의하세요.' }),
        {
          status: 500,
          headers: responseHeaders,
        }
      );
    }

    const prompt = `당신은 대한민국 2030 한국 식단 전문 임상 영양사입니다. 
사용자가 보낸 음식 사진을 정밀하게 관찰하여 한국 식약처 표준치 기준으로 분석하세요.

[시각적 음식 정밀 식별 지침]
1. 음식의 색상과 양념 질감을 세밀히 관찰하세요:
   - 붉은 양념, 고춧가루, 볶은 김치 조각, 참기름 윤기가 있는 볶음밥류(김치볶음밥, 깍두기볶음밥 등)를 흰 쌀밥이나 참치마요와 혼동하지 마세요.
   - 밥 위에 올려진 김가루, 마요네즈, 계란후라이뿐만 아니라 베이스가 되는 밥알의 양념 색감(붉은색/간장색/흰색)을 정확히 구분하세요.
2. 식판, 그릇, 수저 등 주변 오브젝트와의 상대적 크기를 기반으로 정확한 중량(g)과 칼로리를 추정하세요.
3. 사용자가 탭 한 번으로 자신의 식사 상황에 맞게 1초 만에 보정할 수 있도록, 음식 종류에 어울리는 맞춤형 칩(custom_chips) 3~4개를 함께 제안하세요.
- 볶음밥/덮밥: [{"label": "보통 (1인분)", "scale": 1.0}, {"label": "밥 2/3공기", "scale": 0.75}, {"label": "곱빼기", "scale": 1.3}]
- 식판(급식/구내식당): [{"label": "초등 급식", "scale": 0.8}, {"label": "중고등 (기본)", "scale": 1.0}, {"label": "성인 구내식당", "scale": 1.2}, {"label": "국물 제외", "scale": 0.85}]
- 커피/음료: [{"label": "기본", "scale": 1.0}, {"label": "시럽 뺌", "scale": 0.7}, {"label": "대용량 (벤티)", "scale": 1.4}]
- 샐러드: [{"label": "기본", "scale": 1.0}, {"label": "드레싱 뺌", "scale": 0.75}, {"label": "곱빼기", "scale": 1.3}]
- 일반 식사: [{"label": "소식 (0.8x)", "scale": 0.8}, {"label": "보통 (1.0x)", "scale": 1.0}, {"label": "곱빼기 (1.3x)", "scale": 1.3}, {"label": "국물 제외", "scale": 0.85}]

반드시 아래 JSON 형식으로만 완벽하게 응답하세요 (마크다운 백틱 없이 순수 JSON만 출력):
{
  "name": "한식 메뉴명",
  "serving_size": "추정 중량 (예: 1인분 약 350g)",
  "calories": 650,
  "carbs": 75,
  "protein": 35,
  "fat": 20,
  "diet_comment": "인스타그램 식단 스탬프용 위트 있고 센스 있는 한 줄 평 ✨",
  "custom_chips": [
    {"label": "칩라벨", "scale": 1.0}
  ]
}`;

    // 6. 18초 AbortController 타임아웃 가드 (엣지 리소스 무한 점유 방어)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    let apiRes: Response;
    try {
      // 🔒 보안 강화: API Key를 URL 쿼리 파라미터가 아닌 'x-goog-api-key' 헤더로 전송
      apiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: cleanBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await apiRes.json();
    if (!apiRes.ok) {
      console.error('[API/Analyze] Upstream Gemini Error:', data.error);
      throw new Error('Gemini API call failed');
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('Empty AI response');
    }

    const parsed = JSON.parse(rawText);

    // 7. 방어적 데이터 정제 (Sanitization)
    const sanitizedResult = {
      name: typeof parsed.name === 'string' ? parsed.name.slice(0, 100) : '식단 메뉴',
      serving_size: typeof parsed.serving_size === 'string' ? parsed.serving_size.slice(0, 50) : '1인분',
      calories: typeof parsed.calories === 'number' && !isNaN(parsed.calories) ? Math.round(parsed.calories) : 0,
      carbs: typeof parsed.carbs === 'number' && !isNaN(parsed.carbs) ? Math.round(parsed.carbs) : 0,
      protein: typeof parsed.protein === 'number' && !isNaN(parsed.protein) ? Math.round(parsed.protein) : 0,
      fat: typeof parsed.fat === 'number' && !isNaN(parsed.fat) ? Math.round(parsed.fat) : 0,
      diet_comment: typeof parsed.diet_comment === 'string' ? parsed.diet_comment.slice(0, 150) : '오늘도 맛있는 식사 완벽 기록! ✨',
      custom_chips: Array.isArray(parsed.custom_chips)
        ? parsed.custom_chips.slice(0, 6).map((c: any) => ({
            label: typeof c.label === 'string' ? c.label.slice(0, 30) : '보통',
            scale: typeof c.scale === 'number' && !isNaN(c.scale) ? Number(c.scale.toFixed(2)) : 1.0,
          }))
        : [],
    };

    return new Response(JSON.stringify(sanitizedResult), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('[API/Analyze] Unhandled Error:', err);
    if (err?.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'AI 분석 요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.' }),
        {
          status: 504,
          headers: responseHeaders,
        }
      );
    }
    // 8. 내부 시스템 오류 메시지 마스킹
    return new Response(
      JSON.stringify({ error: '식단 분석 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }),
      {
        status: 500,
        headers: responseHeaders,
      }
    );
  }
}
