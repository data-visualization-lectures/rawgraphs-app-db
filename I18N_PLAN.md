# UI多言語対応（日本語・英語）実装プラン

## Context

rawgraphs-app-dbは現在、UIテキストが25以上のコンポーネントファイルにハードコードされた日本語で散在している。`App.js`に `// #TODO: i18n` のコメントがあり、多言語対応は計画されていたが未実装。本変更により、`react-i18next`を導入し、日本語・英語の切り替えを可能にする。

## 設計方針

- **デフォルト言語**: ブラウザ言語を自動検出（`navigator.language`）。日本語ブラウザなら日本語、それ以外は英語にフォールバック
- **言語切り替えUI**: フッター付近に配置（`EN` / `JA` トグルボタン）
- **言語記憶**: localStorage に保存し、次回アクセス時に復元

## ライブラリ選定

**`i18next` + `react-i18next` + `i18next-browser-languagedetector`**
- React 16.13.1互換（hooks・関数コンポーネント対応）
- 軽量（合計~9KB gzipped）
- 補間（interpolation）対応で動的文字列にも対応
- localStorage経由で言語選択を記憶可能

## ファイル構成

```
src/
  i18n/
    index.js              # i18next初期化・設定
    locales/
      ja.json             # 日本語翻訳（現在のハードコード文字列を移行）
      en.json             # 英語翻訳
```

## 実装ステップ

### Step 1: i18n基盤セットアップ
- `npm install i18next react-i18next i18next-browser-languagedetector`
- `src/i18n/index.js` 作成（fallbackLng: 'en'、detection order: `['localStorage', 'navigator']`、日本語ブラウザのみ`ja`）
- `src/i18n/locales/ja.json` と `en.json` 作成（全翻訳キーを定義）
- `src/index.js` に `import './i18n'` 追加

### Step 2: 言語切り替えUI
- `src/components/Footer/Footer.js` にトグルボタンを追加
- フッターのクレジットテキスト横またはその付近に配置
- 現在の言語が`ja`なら「English」、`en`なら「日本語」と表示
- `i18n.changeLanguage()` で切り替え

### Step 3: App.js の移行
- `useTranslation()` 導入
- セクションタイトル（"1. データを読み込む" 等5件）
- ヘッダーボタンラベル、モーダルタイトル、Cookie同意テキスト
- `header.setConfig()` の依存配列に `i18n.language` 追加
- **ファイル**: `src/App.js`

### Step 4: constants.js の移行
- `AGGREGATIONS_LABELS`, `SCALES_LABELS`, `CHART_CATEGORY_LABELS` を翻訳キー参照に変更
- 使用側（ChartDimensionItem, ChartSelector等）で `t()` 呼び出し
- **ファイル**: `src/constants.js`

### Step 5: DataLoader 関連の移行（6ファイル）
- `src/components/DataLoader/DataLoader.js` — オプション名、成功/エラーメッセージ（補間あり）
- `src/components/DataLoader/loaders/UploadFile.js` — ドロップゾーンメッセージ
- `src/components/DataLoader/loaders/LoadProject.js` — ドロップゾーンメッセージ
- `src/components/DataLoader/loaders/SparqlFetch.js` — ラベル・エラー
- `src/components/DataLoader/loaders/UrlFetch.js` — エラーメッセージ
- `src/components/DataSamples/DataSamples.js` — 24件のサンプルデータ名

### Step 6: チャート選択・マッピング（3ファイル）
- `src/components/ChartSelector/ChartSelector.js` — フィルタラベル
- `src/components/DataMapping/DataMapping.js` — セクションヘッダー
- `src/components/DataMapping/ChartDimensionCard.js` — ドロップゾーン指示文

### Step 7: ChartOptions の移行（最も複雑）
- 既存の `translations` オブジェクト（67エントリ）を `ja.json` の `chartOptions.*` キーに移行
- `t('chartOptions.' + option.label, option.label)` でフォールバック付き翻訳
- 新しいチャートオプションが追加されても英語ラベルにフォールバック
- **ファイル**: `src/components/ChartOptions/ChartOptions.js`

### Step 8: ChartPreview の移行
- `ERROR_MESSAGE_MAP` をi18nキー参照方式に変更（regex→キー+補間パラメータ）
- 必須マッピングメッセージ（補間あり）
- **ファイル**: `src/components/ChartPreview/ChartPreview.js`

### Step 9: 残りのモーダル・コンポーネント（5ファイル）
- `src/components/Exporter/CloudSaveModal.js`
- `src/components/DataLoader/loaders/LoadCloudProject.js`
- `src/components/DataLoader/DataMismatchModal.js` — 現在英語のまま→日英両対応
- `src/components/ScreenSizeAlert/ScreenSizeAlert.js`
- `src/components/Exporter/Exporter.js`

### Step 10: ParsingOptions 関連（2ファイル）
- `src/components/ParsingOptions/ParsingOptions.js`
- Footer等の残りコンポーネント

## 特殊ケースの対処方針

| ケース | 方針 |
|--------|------|
| ChartOptions 100+エントリ | `chartOptions.*` キーに移行、フォールバック付き |
| ERROR_MESSAGE_MAP (regex) | パターンは維持、翻訳をi18nキー経由に |
| 補間付き動的文字列 | `t('key', { row, column })` 形式 |
| constants.js のラベル | 使用側で `t('aggregation.' + key)` に変更 |
| サンプルデータ名 | `nameKey` プロパティに変更、`t()` で解決 |
| rawgraphs-charts のチャート名 | チャート名・説明を `chart.name.*` キーで翻訳 |
| `window.confirm/alert` | `t()` を使用 |
| Web Component ヘッダー | `useEffect` 依存配列に言語を追加して再設定 |

## 検証方法

1. `npm start` でアプリ起動
2. 言語切り替えボタンで日本語↔英語を切り替え、全セクションのテキストが切り替わることを確認
3. 各セクション順に確認:
   - データ読み込み画面（各ローダーオプション、成功/エラーメッセージ）
   - チャート選択（フィルタ、カテゴリラベル）
   - マッピング（変数名、ドロップゾーン指示）
   - カスタマイズ（チャートオプションラベル100+件）
   - 書き出し（ダウンロードボタン、クラウド保存モーダル）
4. ブラウザリロード後も言語選択が保持されることを確認（localStorage）
5. 未翻訳のチャートオプションが英語フォールバックで表示されることを確認
