## ローカルビルド方法

### 1. 依存関係を入れる
yarn install

### 2. OpenSSLの互換モードを有効にしてビルドする
export NODE_OPTIONS=--openssl-legacy-provider
yarn build

### ローカルで確認

npx serve -s build


## デプロイ

Netlifyへデプロイされます。設定済み。

