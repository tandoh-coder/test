"use client";
import { useState, useEffect, useRef } from "react";

const SCAN_LINES = 20;
const MAX_IMAGE_MB = 4;

const COMMENTATOR_COLORS = ["#00c8ff", "#ff6b35", "#c084fc"];
const COMMENTATOR_ICONS = ["🎙️", "📢", "💬"];

export default function Home() {
  const [post, setPost] = useState("");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [shared, setShared] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const intervalRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (result && !loading) {
      let current = 0;
      const target = result.lieScore;
      const step = Math.ceil(target / 40);
      intervalRef.current = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(intervalRef.current);
          setGlitch(true);
          setTimeout(() => setGlitch(false), 600);
        }
        setDisplayScore(current);
      }, 30);
      return () => clearInterval(intervalRef.current);
    }
  }, [result, loading]);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイル（JPG・PNG・WEBP）を選択してください");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`画像サイズは${MAX_IMAGE_MB}MB以内にしてください`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImage({ base64: dataUrl.split(",")[1], type: file.type, preview: dataUrl });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!post.trim() && !image) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setDisplayScore(0);
    setShared(false);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post: post.trim() || "",
          ...(image && { image: image.base64, imageType: image.type }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "エラーが発生しました");
      setResult(data);
    } catch (e) {
      setError(e.message || "分析に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s) => {
    if (s < 30) return "#00ff9d";
    if (s < 60) return "#ffd700";
    if (s < 80) return "#ff6b35";
    return "#ff2244";
  };

  const scoreLabel = (s) => {
    if (s < 20) return "クリーン";
    if (s < 40) return "やや疑わしい";
    if (s < 60) return "怪しい";
    if (s < 80) return "かなり危険";
    return "真っ赤な嘘！？";
  };

  const shareToX = () => {
    if (!result) return;
    const snippet = post.length > 30 ? post.slice(0, 30) + "…" : image ? "（画像投稿）" : "";
    const firstComment = result.commentators?.[0];
    const tweet = `【嘘発見スキャナー】\n「${snippet}」\nをAIで分析！\n\n🔍 嘘っぽさ: ${result.lieScore}%\n📊 判定: ${scoreLabel(result.lieScore)}\n💬 ${result.verdict}\n\n${firstComment ? `🎙️ ${firstComment.name}「${firstComment.comment.slice(0, 40)}…」` : ""}\n\n#嘘発見器 #SNS投稿分析`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, "_blank");
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  };

  const mainColor = result ? scoreColor(result.lieScore) : "#00c8ff";
  const canAnalyze = (post.trim().length > 0 || !!image) && !loading;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Noto Sans JP', sans-serif", color: "#e0e0e0", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(0,200,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      {loading && <div style={{ position: "fixed", inset: 0, zIndex: 50, pointerEvents: "none", background: "linear-gradient(180deg, transparent 0%, rgba(0,200,255,0.08) 50%, transparent 100%)", animation: "scanDown 1.2s linear infinite" }} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Orbitron:wght@900&display=swap');
        @keyframes scanDown { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes flicker { 0%,100% { opacity:1; } 93% { opacity:0.4; } 94% { opacity:1; } 96% { opacity:0.7; } 97% { opacity:1; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes glitchAnim { 0% { transform:translate(0); } 20% { transform:translate(-3px,2px); } 40% { transform:translate(3px,-2px); } 60% { transform:translate(-2px,3px); } 80% { transform:translate(2px,-1px); } 100% { transform:translate(0); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideInLeft { from { opacity:0; transform:translateX(-16px); } to { opacity:1; transform:translateX(0); } }
        .glitch { animation: glitchAnim 0.1s steps(2) 5; }
        .fade-in { animation: fadeInUp 0.5s ease forwards; }
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #00c8ff44; border-radius: 3px; }
      `}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "clamp(20px, 5vw, 36px)", fontWeight: 900, color: "#00c8ff", textShadow: "0 0 20px #00c8ff88", animation: "flicker 4s infinite" }}>
            嘘発見スキャナー
          </div>
          <div style={{ fontSize: 12, color: "#00c8ff55", marginTop: 8 }}>
            X・Instagram・SNS投稿の言語パターンをAIが分析します
          </div>
        </div>

        {/* Text Input */}
        <div style={{ border: "1px solid #00c8ff33", background: "rgba(0,200,255,0.03)", borderRadius: 6, marginBottom: 12, boxShadow: "0 0 20px rgba(0,200,255,0.05)" }}>
          <div style={{ padding: "8px 14px", borderBottom: "1px solid #00c8ff22", fontSize: 11, color: "#00c8ff88", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#00c8ff" }}>▶</span> 投稿テキストを貼り付け（画像のみの場合は空欄でもOK）
          </div>
          <textarea
            value={post}
            onChange={(e) => setPost(e.target.value)}
            placeholder={"例：「絶対に儲かる方法を発見した！！\nこれを知らないのは損！リツイート必須！！」"}
            rows={5}
            style={{ width: "100%", background: "transparent", border: "none", color: "#e0e0e0", fontFamily: "'Noto Sans JP', sans-serif", fontSize: 14, lineHeight: 1.8, padding: "14px 16px", resize: "vertical", boxSizing: "border-box", display: "block" }}
          />
          <div style={{ padding: "6px 14px", borderTop: "1px solid #00c8ff11", fontSize: 10, color: "#ffffff22", textAlign: "right" }}>{post.length} 文字</div>
        </div>

        {/* Image Upload */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => !image && fileInputRef.current?.click()}
          style={{ border: `1px dashed ${dragOver ? "#ff6b35" : image ? "#ff6b3566" : "#ffffff22"}`, background: dragOver ? "rgba(255,107,53,0.06)" : image ? "rgba(255,107,53,0.03)" : "rgba(255,255,255,0.02)", borderRadius: 6, marginBottom: 14, cursor: image ? "default" : "pointer", transition: "all 0.2s", overflow: "hidden" }}
        >
          {image ? (
            <div style={{ position: "relative" }}>
              <img src={image.preview} alt="preview" style={{ width: "100%", maxHeight: 260, objectFit: "contain", display: "block", background: "#000" }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "8px 12px", background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#ff6b35" }}>🖼️ 画像をスキャン予定</span>
                <button onClick={(e) => { e.stopPropagation(); setImage(null); }} style={{ background: "rgba(255,34,68,0.3)", border: "1px solid #ff224466", color: "#ff2244", fontSize: 11, padding: "3px 10px", borderRadius: 3, cursor: "pointer" }}>✕ 削除</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📸</div>
              <div style={{ fontSize: 13, color: "#ffffff55", marginBottom: 4 }}>スクリーンショットをドラッグ＆ドロップ</div>
              <div style={{ fontSize: 11, color: "#ffffff33" }}>またはクリックしてファイルを選択　JPG / PNG / WEBP・最大{MAX_IMAGE_MB}MB</div>
              <div style={{ fontSize: 11, color: "#ff6b3566", marginTop: 8 }}>Instagram・X・TikTok などのスクリーンショットに対応</div>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />

        {/* Disclaimer */}
        <div style={{ border: "1px solid #ffd70033", background: "rgba(255,215,0,0.04)", borderRadius: 4, padding: "12px 14px", marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚠️</span>
          <div style={{ fontSize: 11, color: "#ffd70099", lineHeight: 1.75 }}>
            <strong style={{ color: "#ffd700bb", display: "block", marginBottom: 3 }}>ご利用前にお読みください</strong>
            本ツールはエンターテインメント目的のみのAI分析です。テキストの言語的パターンのみを元にスコアを算出しており、投稿者の実際の意図・背景・事実関係は一切考慮されません。特定の人物への誹謗中傷・批判・判断の根拠としてご使用にならないようお願いします。
          </div>
        </div>

        {/* Analyze button */}
        <button
          onClick={analyze}
          disabled={!canAnalyze}
          style={{ width: "100%", padding: "14px", background: canAnalyze ? "rgba(0,200,255,0.08)" : "transparent", border: `1px solid ${canAnalyze ? "#00c8ff" : "#00c8ff33"}`, color: canAnalyze ? "#00c8ff" : "#00c8ff44", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.15em", cursor: canAnalyze ? "pointer" : "not-allowed", borderRadius: 4, transition: "all 0.2s", marginBottom: 28 }}
        >
          {loading
            ? <span>スキャン中<span style={{ animation: "blink 0.8s step-end infinite" }}>...</span></span>
            : image && !post.trim() ? "🖼️ 画像をスキャン＆分析する"
            : image ? "🔍 テキスト＋画像をスキャン＆分析する"
            : "🔍 スキャン＆分析する"
          }
        </button>

        {/* Error */}
        {error && <div style={{ border: "1px solid #ff224488", background: "rgba(255,34,68,0.05)", padding: "12px 16px", color: "#ff2244", fontSize: 13, marginBottom: 24, borderRadius: 4 }}>⚠ {error}</div>}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            {Array.from({ length: SCAN_LINES }).map((_, i) => (
              <div key={i} style={{ height: 2, background: `rgba(0,200,255,${0.04 + (i % 5) * 0.04})`, margin: "4px auto", borderRadius: 1, width: `${55 + (i * 2.1) % 42}%`, animation: `flicker ${0.6 + (i % 3) * 0.3}s infinite`, animationDelay: `${i * 0.04}s` }} />
            ))}
            <div style={{ marginTop: 24, fontSize: 13, color: "#00c8ff77" }}>
              {image ? "画像を解析中..." : "言語パターンを解析中..."}
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="fade-in">

            {/* Score card */}
            <div style={{ border: `1px solid ${mainColor}44`, background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "32px 24px 24px", marginBottom: 16, textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${mainColor}07 0%, transparent 65%)`, pointerEvents: "none" }} />
              <div style={{ fontSize: 11, letterSpacing: "0.2em", color: mainColor + "77", marginBottom: 10 }}>嘘っぽさ指数</div>
              <div className={glitch ? "glitch" : ""} style={{ fontFamily: "'Orbitron', monospace", fontSize: "clamp(72px, 18vw, 108px)", fontWeight: 900, color: mainColor, lineHeight: 1, textShadow: `0 0 30px ${mainColor}66` }}>
                {displayScore}<span style={{ fontSize: "0.38em", opacity: 0.7 }}>%</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: mainColor, marginTop: 10 }}>{scoreLabel(result.lieScore)}</div>
              <div style={{ marginTop: 14, fontSize: 14, color: "#ffffffaa", padding: "10px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 4, display: "inline-block", maxWidth: "90%" }}>
                💬 「{result.verdict}」
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "#ffffff33" }}>分析精度: {result.confidence}</div>
              {result.extractedText && (
                <div style={{ marginTop: 14, padding: "10px 14px", border: "1px solid #ffffff11", borderRadius: 4, background: "rgba(255,255,255,0.03)", textAlign: "left" }}>
                  <div style={{ fontSize: 10, color: "#ffffff44", marginBottom: 4 }}>🖼️ 画像から読み取ったテキスト</div>
                  <div style={{ fontSize: 12, color: "#ffffff88", lineHeight: 1.6 }}>{result.extractedText}</div>
                </div>
              )}
            </div>

            {/* Factors */}
            <div style={{ border: "1px solid #ffffff0f", background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "20px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#ffffff44", marginBottom: 20 }}>📊 詳細分析</div>
              {result.factors?.map((f, i) => (
                <div key={i} style={{ marginBottom: 16, opacity: 0, animation: `fadeInUp 0.4s ease ${i * 0.1}s forwards` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: "#cccccc" }}>{f.label}</span>
                    <span style={{ color: scoreColor(f.score), fontWeight: 700 }}>{f.score}%</span>
                  </div>
                  <div style={{ height: 5, background: "#ffffff08", borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
                    <div style={{ height: "100%", width: `${f.score}%`, background: `linear-gradient(90deg, ${scoreColor(f.score)}77, ${scoreColor(f.score)})`, borderRadius: 3, transition: "width 1s ease" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#ffffff44" }}>{f.detail}</div>
                </div>
              ))}
            </div>

            {/* Commentators */}
            {result.commentators?.length > 0 && (
              <div style={{ border: "1px solid #ffffff0f", background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "20px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#ffffff44", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                  📺 <span>大衆の見方 ── コメンテーター席</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {result.commentators.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        opacity: 0,
                        animation: `slideInLeft 0.4s ease ${i * 0.15}s forwards`,
                        background: `rgba(${i === 0 ? "0,200,255" : i === 1 ? "255,107,53" : "192,132,252"},0.05)`,
                        border: `1px solid ${COMMENTATOR_COLORS[i]}22`,
                        borderLeft: `3px solid ${COMMENTATOR_COLORS[i]}`,
                        borderRadius: 6,
                        padding: "14px 16px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{COMMENTATOR_ICONS[i]}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COMMENTATOR_COLORS[i] }}>{c.name}</div>
                          <div style={{ fontSize: 10, color: "#ffffff44", marginTop: 1 }}>{c.role}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: "#ffffffbb", lineHeight: 1.8, paddingLeft: 26 }}>
                        「{c.comment}」
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <button
              onClick={shareToX}
              style={{ width: "100%", padding: "14px", background: shared ? "rgba(29,161,242,0.2)" : "rgba(29,161,242,0.08)", border: "1px solid rgba(29,161,242,0.5)", color: shared ? "#aaddff" : "#1DA1F2", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", borderRadius: 4, transition: "all 0.2s", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.851L1.254 2.25H8.08l4.265 5.638L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" /></svg>
              {shared ? "✓ 投稿しました！" : "Xに結果を共有する"}
            </button>

            {/* Warning */}
            <div style={{ border: "1px solid #ffffff11", padding: "14px 16px", borderRadius: 4, background: "rgba(255,255,255,0.03)" }}>
              <div style={{ fontSize: 11, color: "#ffffff44", lineHeight: 1.8 }}>
                <span style={{ color: "#ffd70066", marginRight: 6 }}>⚠</span>
                {result.warning}　このスコアは投稿文テキストの言語パターンのみを分析したものであり、投稿の真偽・投稿者の人格・背景情報は反映されていません。エンターテインメント以外の目的でのご利用はお控えください。
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 48, textAlign: "center", fontSize: 10, color: "#ffffff12" }}>
          Groq AI powered · エンターテインメント目的のみ
        </div>
      </div>
    </div>
  );
}
