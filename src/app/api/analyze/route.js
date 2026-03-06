import Groq from "groq-sdk";

const TEXT_PROMPT = `あなたはSNS投稿の言語パターン分析の専門家です。以下の投稿文を分析してください。

投稿文:
"""
{POST}
"""

以下の観点で分析し、JSON形式のみで返してください。前後に説明文は不要です。

{
  "lieScore": (0〜100の整数。言語的な「虚偽サイン」の強さ。高いほど怪しい言語パターンが多い),
  "confidence": ("低" | "中" | "高"),
  "factors": [
    {"label": "指標名", "score": (0〜100), "detail": "簡潔な説明（20字以内）"}
  ],
  "verdict": "総合的な一言コメント（30字以内、辛口・ユーモラスに）",
  "commentators": [
    {
      "name": "コメンテーター名（例：鋭いご意見番、辛口評論家、庶民派主婦、若者代表など、バラエティに富んだ架空の人物）",
      "role": "肩書き（例：社会評論家、元刑事、マーケター、SNS研究家など）",
      "comment": "そのキャラクターらしい口調・視点で大衆目線のコメント（50〜80字。辛口・的確・ユーモラスに。「〜ですよね」「〜じゃないですか」など話し言葉で）"
    }
  ],
  "warning": "注意書き（このスコアはあくまで言語的な表現パターンの分析であり、実際の真偽を判定するものではありません）"
}

分析する指標（5つ）:
1. 過剰な断言・絶対表現（「絶対」「100%」「必ず」など）
2. 感情的な煽り・誇張（誇大表現、感嘆符の多用）
3. 出典・根拠の曖昧さ（「〜らしい」「〜と聞いた」など）
4. 自己矛盾・論理的飛躍
5. 防衛的・言い訳的表現（「でも」「だって」の多用）

コメンテーターは必ず3人生成し、それぞれ異なる視点・口調・年代層を代表させること。
重要: JSONのみ返すこと。`;

const IMAGE_PROMPT = `あなたはSNS投稿の言語パターン分析の専門家です。
添付された画像はSNS投稿のスクリーンショットです。

【手順】
1. 画像内のテキスト（キャプション・テロップ・コメント・説明文など）をすべて読み取る
2. 読み取ったテキストと画像全体の内容をもとに以下の指標で分析する
3. テキストが少ない・読み取れない場合は画像の雰囲気・演出・誇張表現なども考慮する

以下の観点で分析し、JSON形式のみで返してください。前後に説明文は不要です。

{
  "lieScore": (0〜100の整数。言語的・視覚的な「虚偽サイン」の強さ。高いほど怪しい),
  "confidence": ("低" | "中" | "高"),
  "extractedText": "画像から読み取ったテキストの要約（60字以内）",
  "factors": [
    {"label": "指標名", "score": (0〜100), "detail": "簡潔な説明（20字以内）"}
  ],
  "verdict": "総合的な一言コメント（30字以内、辛口・ユーモラスに）",
  "commentators": [
    {
      "name": "コメンテーター名（例：鋭いご意見番、辛口評論家、庶民派主婦、若者代表など、バラエティに富んだ架空の人物）",
      "role": "肩書き（例：社会評論家、元刑事、マーケター、SNS研究家など）",
      "comment": "そのキャラクターらしい口調・視点で大衆目線のコメント（50〜80字。辛口・的確・ユーモラスに。「〜ですよね」「〜じゃないですか」など話し言葉で）"
    }
  ],
  "warning": "注意書き（このスコアはあくまで言語的・視覚的な表現パターンの分析であり、実際の真偽を判定するものではありません）"
}

分析する指標（5つ）:
1. 過剰な断言・絶対表現（「絶対」「100%」「必ず」など）
2. 感情的な煽り・誇張（誇大表現、感嘆符・強調の多用）
3. 出典・根拠の曖昧さ（「〜らしい」「〜と聞いた」など）
4. 自己矛盾・論理的飛躍
5. 視覚的な誇張・演出（過剰なフィルター・加工・ビフォーアフターなど）

コメンテーターは必ず3人生成し、それぞれ異なる視点・口調・年代層を代表させること。
重要: JSONのみ返すこと。`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { post, image, imageType } = body;

    const hasImage = image && imageType;
    const hasText = post && typeof post === "string" && post.trim().length > 0;

    if (!hasImage && !hasText) {
      return Response.json({ error: "テキストまたは画像を入力してください" }, { status: 400 });
    }

    if (hasText && post.length > 1000) {
      return Response.json({ error: "投稿文が長すぎます（1000文字以内）" }, { status: 400 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    let messages;

    if (hasImage) {
      const contentParts = [
        {
          type: "image_url",
          image_url: { url: `data:${imageType};base64,${image}` },
        },
        {
          type: "text",
          text: hasText
            ? IMAGE_PROMPT + `\n\nなお、ユーザーが以下のテキストも補足として入力しています：\n"""\n${post}\n"""`
            : IMAGE_PROMPT,
        },
      ];
      messages = [{ role: "user", content: contentParts }];
    } else {
      messages = [{ role: "user", content: TEXT_PROMPT.replace("{POST}", post) }];
    }

    const completion = await groq.chat.completions.create({
      model: hasImage ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile",
      messages,
      max_tokens: 1500,
      temperature: 0.5,
    });

    const text = completion.choices[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return Response.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return Response.json(
      { error: "分析に失敗しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
