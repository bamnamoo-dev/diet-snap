// Vercel Serverless Function: /api/analyze

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');

    const apiKey = process.env.GEMINI_API_KEY;
    // Gemini 3.5 Flash-Lite 단독 고정
    const model = 'gemini-3.5-flash-lite';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
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

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    const data = await apiRes.json();
    if (!apiRes.ok) {
      throw new Error(data.error?.message || 'Gemini API call failed');
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const jsonResult = JSON.parse(rawText);

    return new Response(JSON.stringify(jsonResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
