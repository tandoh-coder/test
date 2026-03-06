export const metadata = {
  title: "嘘発見スキャナー",
  description: "X投稿の言語パターンをAIが分析します",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
