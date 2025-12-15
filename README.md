# RawGraphs


## 本レポジトリでの改善点

- 日本語化対応 (Localization)...UIや説明文、エラーメッセージに至るまで包括的な日本語化
- UI/UXの改善・調整 (UI/UX Improvements)...ワークフローをスムーズにするための微調整
- 機能・保守面の強化 (Technical & Maintenance)...ライブラリの修正や更新


## 本レポジトリでの独自機能

- プロジェクトファイルのクラウド保存および呼び出し




## インストール＆ビルド方法

### 依存関係を入れる
yarn install

### ローカルビルド方法

export NODE_OPTIONS=--openssl-legacy-provider
yarn build

### ローカルで確認

npx serve -s build


### デプロイ

Netlifyへデプロイされます。設定済み。

