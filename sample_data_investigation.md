# サンプルデータ取得元に関する調査報告

本ツール（RAWGraphsのカスタム版）で利用されているサンプルデータの取得元および管理状況についての調査結果をまとめます。

## 1. データの格納場所
サンプルデータの実体は、プロジェクト内の以下のディレクトリにローカルファイルとして保存されています。
- `public/sample-datasets/`

これらのファイルはビルド時に公開ディレクトリに配置され、アプリケーションから直接 `fetch` されます。

## 2. レポジトリの系統と管理状況
本プロジェクトは以下の系統で管理されています。

- **現在のレポジトリ**: `data-visualization-lectures/rawgraphs-app-db`
- **上流（フォーク元）**: `data-visualization-lectures/rawgraphs-app`
- **オリジナルのソース**: [rawgraphs/rawgraphs-app](https://github.com/rawgraphs/rawgraphs-app)

サンプルデータの大半はオリジナルの RAWGraphs 2.0 から継承されたものですが、本レポジトリにおいて日本語化（ローカライズ）が行われています。

## 3. 個別データの取得元（ソース）
各データセットの出典は、`src/components/DataSamples/DataSamples.js` 内で定義されています。主な出典元は以下の通りです。

| カテゴリ | 主な出典元（Source） | 公式URL/詳細 |
| :--- | :--- | :--- |
| 公共データ | NYC Open Data, Eurostat, gov.uk, Comune di Milano | 各種政府・自治体ポータル |
| オープンデータ集 | Kaggle, [vega-datasets](https://github.com/vega/vega-datasets) | データサイエンス用プラットフォーム |
| 知識ベース | Wikipedia, Wikidata | 百科事典・構造化データ |
| 専門機関 | RIAA (全米レコード協会), World Happiness Report | 業界団体・調査報告書 |
| 自然科学 | NOAA (アメリカ海洋大気庁) | 気象・環境データ |

## 4. 補足
特定の1つの「データ専用レポジトリ」から取得しているわけではなく、世界中で公開されている様々なオープンデータを、RAWGraphs チームが可視化のサンプルとして最適化し、本プロジェクトで日本語化したものが利用されています。
