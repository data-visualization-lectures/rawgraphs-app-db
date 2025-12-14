# トラブルシューティング報告書: Supabase 401 Invalid API Key エラー

## 1. 問題の概要
デプロイ環境において、RawGraphs ツールから Supabase へのプロジェクト一覧取得（`GET /rest/v1/projects`）を行った際、一貫して `401 Unauthorized` エラーが発生する。
レスポンスボディ: `{"message":"Invalid API key","hint":"Double check your Supabase 'anon' or 'service_role' API key."}`

## 2. 検証済みの前提事実
以下の要素については、ユーザーとAI双方が確認し、**問題がない（正しい）** ことが確定している。

*   **API Key (Anon Key)**:
    *   Supabase ダッシュボード上の値と、コード内で使用している値（ハードコード含む）は完全一致している。
    *   スクリーンショットにより確認済み。
*   **Project ID / URL**:
    *   `vebhoeiltxspsurqoxvl` であり、整合している。
*   **RLS (Row Level Security)**:
    *   検証のため、一時的に **Disabled** (無効) に設定されている。
    *   これにより、本来であれば有効な Anon Key さえあればアクセス可能であるはず。

## 3. 実施した調査と試行
解決に向け、以下の順序で実装側からのアプローチを行った。

### Phase 1: クライアント実装の修正
*   **試行**: `window.supabase` (Global Instance) を再利用する実装に変更。
*   **結果**: 失敗。
*   **判明した事実**: `window.supabase` インスタンス内部の `rest.headers` 設定が空であり、デフォルトで `apikey` ヘッダーを送っていないことがログから判明。

### Phase 2: クライアントの強制再作成とヘッダー注入
*   **試行**: `window.Supabase.createClient` を使用し、アプリ内で専用クライアントを新規作成。`global.headers` オプションおよび `client.rest.headers.set()` メソッドを使い、強制的に `apikey` ヘッダーを注入。
*   **結果**: 失敗 (401)。
*   **判明した事実**: ブラウザ側の `console.log` では、間違いなく `headers: { apikey: 'eyJ...' }` がセットされていることが確認できた。しかしサーバーは拒否した。

### Phase 3: ライブラリ不使用の Raw Fetch 検証
*   **試行**: `supabase-js` ライブラリのバグを疑い、標準の `fetch` API を使用してリクエストを作成。URLパラメータやヘッダーの組み合わせを変えて検証。
    1.  `Headers: { apikey, Authorization }` → 失敗 (401)
    2.  `Query Param: ?apikey=...` + `Headers: { apikey }` (Authなし) → 失敗 (401)

## 4. ログ分析による決定的な発見
ユーザーより提供された Supabase 側のアクセスログにより、以下の事実が判明した。

```json
"sb": [
  {
    "apikey": []  // 空配列 = 受信していない
  }
],
"request": [
  {
    "headers": [
      {
         // ここに 'apikey' ヘッダーが存在しない
         "x_client_info": "supabase-js-web/2.87.1",
         "user_agent": "Mozilla/5.0 ... Chrome/143..."
      }
    ]
  }
]
```

### 結論
**ブラウザからは `apikey` ヘッダーを送信しているが、Supabase のアプリケーションサーバーに到達する前に、通信経路のどこかでヘッダーが除去（Strip）されている。**

これが `401 Invalid API key` の真の原因である。サーバーには「鍵なし」でアクセスが来ており、正当に拒否している。

### 疑わしい要因
*   ご使用のネットワーク環境（企業Proxy、FWなど）による非標準ヘッダーの削除。
*   ブラウザ拡張機能やセキュリティソフトによる改変。
*   ブラウザバージョン (`Chrome/143.0.0.0`) が示す通り、特殊なビルドまたは環境である可能性。

## 5. 現在のアクションと回避策案
ヘッダーが除去される環境であることを前提とし、それを回避して認証を通す方法を試行中。

*   **現在検証中の策**: `Authorization` ヘッダーに Anon Key をセットする。
    *   `Authorization` ヘッダーはログ上でも通過していることが確認済み。
    *   ここにユーザーTokenではなく、Anon Key（`Bearer <ANON_KEY>`）をセットすることで、「匿名ユーザー」として認証を突破できる可能性がある。

以上
