# RawGraphs Custom Chart Implementation Guide

このドキュメントでは、RawGraphs (v2.0) に独自のカスタムチャートを追加する手順と注意点をまとめました。
今回の「Histogram」の実装経験に基づいています。

## 1. 公式リソース

開発にあたっては、以下の公式リソースが参考になります。

*   **RawGraphs Core**: [https://github.com/rawgraphs/rawgraphs-core](https://github.com/rawgraphs/rawgraphs-core)
    *   チャートのデータ処理やパラメータ定義などのコアロジック。
*   **RawGraphs Charts**: [https://github.com/rawgraphs/rawgraphs-charts](https://github.com/rawgraphs/rawgraphs-charts)
    *   標準搭載されているチャートのソースコード。実装の参考に最適です。`src/` 以下に各チャートのコードがあります。
*   **RawGraphs App**: [https://github.com/rawgraphs/rawgraphs-app](https://github.com/rawgraphs/rawgraphs-app)
    *   このリポジトリです。フロントエンドアプリケーション全体。

## 2. ファイル構成

カスタムチャートは `src/custom_charts/[chart_name]` ディレクトリに配置します。
1つのチャートは以下の5つのファイルで構成されます。

| ファイル名 | 役割 | 必須/任意 |
| :--- | :--- | :--- |
| `index.js` | エントリーポイント。各モジュールをまとめて export します。 | **必須** |
| `metadata.js` | チャート名、ID、説明文、サムネイル画像などのメタデータ。 | **必須** |
| `mapping.js` | データの次元（Dimensions）定義と、データ変換ロジック（`mapData`）。 | **必須** |
| `visualOptions.js` | 色、サイズ、余白などの視覚的オプション定義。 | 任意 |
| `render.js` | 実際に描画を行う関数（通常は D3.js を使用）。 | **必須** |

作成後、`src/charts.js` に `index.js` をインポートし、リストに追加することでアプリに認識させます。

## 3. 実装上の重要ポイント・注意点

### `mapping.js` の `mapData` 関数 (最重要)

RawGraphs v2.0 では、**`mapData` 関数の実装が必須** です。
これがないと、データ処理パイプラインが途中で停止し、エラーも出ずに「描画されない」という状態になります。

```javascript
// mapping.js
export const mapData = function (data, mapping, dataTypes, dimensions) {
  // 必要な次元（Dimension）の定義を取得
  const valueDimension = dimensions.find((d) => d.id === 'value')
  
  // データを使いやすい形に変換して返す
  return data.map((d) => ({
    // ★注意: mapping[id].value は列名の文字列です。配列アクセス [0] は不要です（単一選択の場合）。
    value: d[mapping[valueDimension.id].value], 
  }))
}
```

**ハマりポイント:**
*   `mapping[dimensionId].value` は、ユーザーがUIでドラッグ＆ドロップした **「列名（文字列）」** です。
*   これを `[0]` でアクセスしてしまうと、列名の「1文字目」を取得してしまい、データアクセス時に `undefined` (NaN) になります。

### データ型とデバッグ

*   **型変換**: `mapData` 内で安易に `Number()` や `parseFloat()` で型変換を行うのは推奨されません（ユーザーが意図しない挙動になる可能性があります）。RawGraphs の `dataTypes` を信頼するか、公式チャートの実装（`getDimensionAggregator` など）を参考にしてください。
*   **デバッグ**: 描画されないときは、`render.js` の先頭で `console.log` を出し、データや `mapping` オブジェクトの中身を確認するのが近道です。特に `typeof data[0].value` をチェックして、文字列か数値かを確認しましょう。

### `visualOptions.js`

*   `type: 'color'` (単一色選択) と `type: 'colorScale'` (データに基づく色分け) は異なります。
*   `colorScale` を使う場合は、対応する `dimension` (例: `color`) が `mapping.js` に存在する必要があります。存在しない次元を参照するとエラーになります。単純に一色で塗るだけなら `type: 'color'` を使いましょう。

## 4. サムネイル画像とアイコン

カスタムチャートには、リスト表示用の「アイコン（SVG）」と、選択時のプレビュー用の「サムネイル（SVG）」の2種類が必要です。
GitHub上の公式リソース（URL）は存在しないため、**ローカルのファイル** を使用します。
他のチャートとの統一感を保つため、**両方ともSVG形式** で作成することを推奨します。

1.  **アイコン**: SVG形式。`icon.svg` として保存します（正方形、アスペクト比 1:1）。
2.  **サムネイル**: SVG形式。`thumbnail.svg` として保存します（長方形、アスペクト比 2:1程度）。
3.  `metadata.js` でこれらを import して割り当てます。

```javascript
// metadata.js
import thumbnail from './thumbnail.svg'
import icon from './icon.svg'

export const metadata = {
  // ...
  thumbnail: thumbnail, // チャート選択時のプレビュー画像 (SVG)
  icon: icon,           // チャート一覧のアイコン (SVG)
  // ...
}
```

## 5. カテゴリの日本語化

既存のチャートと同じグループに表示させるためには、`src/constants.js` で定義されている **英語のキー** を使用する必要があります。
`metadata.js` の `categories` 配列には、日本語ではなく、対応する英語のキーを指定してください。

```javascript
// metadata.js
export const metadata = {
  // ...
  categories: ['distributions'], // '分布' ではなく 'distributions' を指定
  // ...
}
```

**主なカテゴリキーと表示名の対応（`src/constants.js` より）:**
*   `distributions`: 分布
*   `correlations`: 相関
*   `time series`: 時系列
*   `proportions`: 比率
*   `hierarchies`: ツリー
*   `networks`: ネットワーク

URLを直接文字列で指定しても、そのURLがリンク切れになったり、オフライン環境だったりすると画像が表示されません。必ず import してバンドルに含めるようにしましょう。
