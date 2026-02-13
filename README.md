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
npx serve -s build -l 9000

export NODE_OPTIONS=--openssl-legacy-provider && npm start

リダイレクトを回避するために /?auth_debug を追加してください。

http://localhost:3000/?auth_debug
http://localhost:9000/?auth_debug
http://192.168.43.107:9000/?auth_debug

### デプロイ

Netlifyへデプロイされます。設定済み。

