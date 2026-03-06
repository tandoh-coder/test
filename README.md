# 嘘発見スキャナー - デプロイ手順

## 構成図
```
ユーザーのブラウザ → Vercelサーバー（APIキーを保管）→ Groq API
                        ↑ APIキーはここにしか存在しない
```

---

## STEP 1: Groq APIキーを取得する

1. https://console.groq.com にアクセス
2. 「Sign Up」でアカウント作成（Googleアカウントでも可）
3. ログイン後、左メニューの「API Keys」をクリック
4. 「Create API Key」ボタンを押す
5. 表示されたキー（`gsk_`から始まる文字列）をメモ帳などにコピーしておく
   ⚠️ このキーは一度しか表示されません。必ずコピーしてください！

---

## STEP 2: GitHubにコードをアップロードする

1. https://github.com にアクセスし、アカウント作成
2. 右上の「+」→「New repository」をクリック
3. Repository name に `lie-detector` と入力
4. 「Private」を選択（公開したくない場合）
5. 「Create repository」をクリック
6. 表示された指示に従ってこのフォルダをアップロード
   （「uploading an existing file」リンクからファイルをドラッグ＆ドロップでもOK）
   
   ⚠️ `.env.local` ファイルは **絶対にアップロードしないでください**！
      `.gitignore` に記載済みなので、gitコマンドを使えば自動的に除外されます。

---

## STEP 3: Vercelにデプロイする

1. https://vercel.com にアクセス
2. 「Sign Up」→「Continue with GitHub」でGitHubアカウントでログイン
3. 「Add New Project」→ 先ほど作った `lie-detector` リポジトリを選択
4. 「Import」をクリック

### ★ 重要: 環境変数（APIキー）を設定する

5. デプロイ画面の「Environment Variables」セクションを開く
6. 以下を入力する：
   - Name（名前）: `GROQ_API_KEY`
   - Value（値）: STEP 1 でコピーした `gsk_` から始まるAPIキー
7. 「Add」ボタンを押す
8. 「Deploy」ボタンを押す

---

## STEP 4: 完成！

数分後にデプロイが完了し、
`https://lie-detector-xxxx.vercel.app` のような公開URLが発行されます。

---

## ローカルで動かす場合（開発用）

```bash
# 依存パッケージをインストール
npm install

# .env.local にAPIキーを設定（.env.localファイルを編集）
# GROQ_API_KEY=gsk_xxxxxxxxxx

# 開発サーバーを起動
npm run dev
```
→ http://localhost:3000 で確認できます

---

## よくある質問

**Q: APIキーが漏れたかもしれない**
A: すぐに https://console.groq.com の「API Keys」でキーを削除し、新しいキーを発行してVercelの環境変数を更新してください。

**Q: 料金はかかりますか？**
A: Groqは個人利用レベルでは無料枠で十分まかなえます。Vercelも無料枠内で運用できます。
