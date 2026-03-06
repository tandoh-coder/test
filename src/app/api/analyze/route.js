import Groq from "groq-sdk";

const ANALYSIS_PROMPT = `あなたはSNS投稿の言語パターン分析の専門家です。以下のX（旧Twitter）の投稿文を分析してください。

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
  "warning": "注意書き（このスコアはあくまで言語的な表現パターンの分析であり、実際の真偽を判定するものではありません）"
}

分析する指標（5つ）:
1. 過剰な断言・絶対表現（「絶対」「100%」「必ず」など）
2. 感情的な煽り・誇張（誇大表現、感嘆符の多用）
3. 出典・根拠の曖昧さ（「〜らしい」「〜と聞いた」など）
4. 自己矛盾・論理的飛躍
5. 防衛的・言い訳的表現（「でも」「だって」の多用）

重要: JSONのみ返すこと。`;

export async function POST(request) {
  try {
    const { post } = await request.json();

    if (!post || typeof post !== "string" || post.trim().length === 0) {
      return Response.json({ error: "投稿文が空です" }, { status: 400 });
    }

    if (post.length > 1000) {
      return Response.json({ error: "投稿文が長すぎます（1000文字以内）" }, { status: 400 });
    }

    // APIキーはサーバー側の環境変数から読む（クライアントには絶対に渡らない）
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "user",
          content: ANALYSIS_PROMPT.replace("{POST}", post),
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
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
