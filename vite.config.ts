import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const MAX_BASE64_LENGTH = 7 * 1024 * 1024; // 약 5MB 허용

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'gemini-analyze-api',
        configureServer(server) {
          server.middlewares.use('/api/analyze', async (req, res) => {
            console.log(`[API] /api/analyze ${req.method} request received at ${new Date().toLocaleTimeString()}`);
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
              if (body.length > MAX_BASE64_LENGTH) {
                res.statusCode = 413;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: '이미지 용량이 너무 큽니다. (최대 5MB 허용)' }));
                req.destroy();
              }
            });

            req.on('end', async () => {
              if (res.writableEnded) return;

              try {
                const parsed = JSON.parse(body);
                const imageBase64 = parsed?.imageBase64;
                if (!imageBase64 || typeof imageBase64 !== 'string') {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: '유효한 이미지 데이터가 필요합니다.' }));
                  return;
                }

                if (imageBase64.length > MAX_BASE64_LENGTH) {
                  res.statusCode = 413;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: '이미지 용량이 너무 큽니다. (최대 5MB 허용)' }));
                  return;
                }

                // data:image/webp;base64,... 에서 순수 base64 및 mimeType 추출
                const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
                const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
                const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();

                if (!cleanBase64 || cleanBase64.length < 50) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: '손상되었거나 유효하지 않은 이미지입니다.' }));
                  return;
                }

                const apiKey = env.GEMINI_API_KEY;
                const model = 'gemini-3.5-flash-lite';

                if (!apiKey) {
                  throw new Error('GEMINI_API_KEY is not set in .env.local');
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

                // 18초 AbortController 타임아웃 가드
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 18000);

                let apiRes: Response;
                try {
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
                  console.error('Gemini API error:', data.error);
                  throw new Error('Gemini API response error');
                }

                const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!rawText) {
                  throw new Error('No candidate content received from Gemini');
                }

                const jsonResult = JSON.parse(rawText);

                // 방어적 데이터 정제
                const sanitizedResult = {
                  name: typeof jsonResult.name === 'string' ? jsonResult.name.slice(0, 100) : '식단 메뉴',
                  serving_size: typeof jsonResult.serving_size === 'string' ? jsonResult.serving_size.slice(0, 50) : '1인분',
                  calories: typeof jsonResult.calories === 'number' && !isNaN(jsonResult.calories) ? Math.round(jsonResult.calories) : 0,
                  carbs: typeof jsonResult.carbs === 'number' && !isNaN(jsonResult.carbs) ? Math.round(jsonResult.carbs) : 0,
                  protein: typeof jsonResult.protein === 'number' && !isNaN(jsonResult.protein) ? Math.round(jsonResult.protein) : 0,
                  fat: typeof jsonResult.fat === 'number' && !isNaN(jsonResult.fat) ? Math.round(jsonResult.fat) : 0,
                  diet_comment: typeof jsonResult.diet_comment === 'string' ? jsonResult.diet_comment.slice(0, 150) : '오늘도 맛있는 식사 완벽 기록! ✨',
                  custom_chips: Array.isArray(jsonResult.custom_chips)
                    ? jsonResult.custom_chips.slice(0, 6).map((c: any) => ({
                        label: typeof c.label === 'string' ? c.label.slice(0, 30) : '보통',
                        scale: typeof c.scale === 'number' && !isNaN(c.scale) ? Number(c.scale.toFixed(2)) : 1.0,
                      }))
                    : [],
                };

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(sanitizedResult));
              } catch (err: any) {
                console.error('[API/Analyze] Error:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: '식단 분석 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }));
              }
            });
          });
        },
      },
    ],
    server: {
      port: 3000,
      host: true,
      open: false,
    },
  };
});
