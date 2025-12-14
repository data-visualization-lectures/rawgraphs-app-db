# RawGraphs クラウド保存機能 拡張計画 (CLOUD_SAVE_PLAN_2)

## 1. 概要
`CLOUD_SAVE_PLAN.md` で実装されたクラウド保存機能に対し、以下の2つの機能追加を行います。

1.  **サムネイル画像自動保存**: プロジェクト保存時に、現在のチャート表示を画像（PNG）として同時に保存する。
2.  **カード形式での一覧表示**: プロジェクト一覧画面を、サムネイル画像付きのカードグリッドデザインに変更する。

## 2. アーキテクチャ更新

### A. データベース (`projects` テーブル) の変更
サムネイル画像のパスを保存するためのカラムを追加します。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `thumbnail_path` | `text` | Storage 内のサムネイル画像パス (例: `{user_id}/{project_uuid}.png`) |

### B. Supabase Storage の利用
既存の `user_projects` バケットを引き続き利用します。
プロジェクトJSONと同じディレクトリに、同名の画像ファイルを拡張子違いで保存します。

*   JSON: `{user_id}/{project_uuid}.json`
*   PNG: `{user_id}/{project_uuid}.png`

### C. フロントエンド実装方針

#### 1. サムネイル生成とアップロード (Exporter周辺)
*   **画像生成ロジックの抽出**: `src/components/Exporter/Exporter.js` にある `downloadImage` のロジックを再利用し、ダウンロードではなく **Blob オブジェクトを返す** 関数 `generateThumbnailBlob` を実装します。
*   **モーダルへの連携**: `CloudSaveModal` コンポーネントに、この `generateThumbnailBlob` 関数（またはそれをラップしたもの）をプロパティとして渡します。
*   **保存フローの変更**:
    1. ユーザーが「保存」ボタンをクリック。
    2. JSONデータの生成 (`exportProject`)。
    3. サムネイル画像の生成 (`generateThumbnailBlob`)。
    4. 両方のデータを `cloudApi.saveProject` に渡す。

#### 2. APIロジック更新 (`cloudApi.js/saveProject`)
*   引数に `thumbnailBlob` を追加。
*   JSONファイルのアップロードに加え、画像ファイルのアップロード処理を追加。
*   DB INSERT 時に、`thumbnail_path` カラムにも値をセット。

#### 3. プロジェクト一覧の刷新 (`LoadCloudProject.js`)
*   **ロードロジック**: `getProjects` で `thumbnail_path` も取得するようにAPIを変更（全カラム取得なら対応不要）。
*   **サムネイル取得**:
    *   Storage バケットが Private のため、単純な `<img>` タグでは表示できません。
    *   各プロジェクトの描画時に、`thumbnail_path` を使って Storage から画像データ（Blob/Object URL）を非同期で取得するコンポーネント（例: `<ProjectCard />`）を作成します。
    *   **注意**: リスト数が多い場合、N回のフェッチが発生するため、必要に応じてキャッシュや遅延読み込みを検討します（まずは単純実装で進めます）。
*   **UIデザイン**:
    *   `react-bootstrap` の `Card` コンポーネントを使用。
    *   画像、プロジェクト名、更新日、操作ボタン（開く/削除）を配置。
    *   Grid レイアウトで並べる。

## 3. 実装ステップ

### Step 1: データベース更新 (SQL実行)
以下のSQLをSupabaseダッシュボードのSQL Editorで実行し、カラムを追加してください。

```sql
ALTER TABLE public.projects 
ADD COLUMN thumbnail_path text;
```
※ 既存のレコードがある場合、このカラムは `NULL` になりますが問題ありません。

### Step 2: 画像生成機能の実装
1.  `Exporter.js` をリファクタリングし、`getThumbnailBlob()` を `CloudSaveModal` に渡せるようにする。
2.  `CloudSaveModal` から `saveProject` へ Blob を渡す接続を行う。

### Step 3: クラウドAPI (`cloudApi.js`) の更新
1.  `saveProject` に画像アップロード処理を追加。パスは `{id}.png`。
2.  `deleteProject` に画像削除処理を追加。

### Step 4: 一覧UI (`LoadCloudProject.js`) の刷新
1.  `Table` を `Card` Grid に置き換え。
2.  サムネイル表示用のサブコンポーネントを作成し、`cloudApi` 経由で画像を取得して表示。

