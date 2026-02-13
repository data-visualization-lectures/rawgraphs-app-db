# seriesビジュアル変数のデータ加工処理一覧

## 概要

RAWGraphsの各チャートで`series`ビジュアル変数が指定された場合、データは内部的に**グループ化**され、各グループが個別のサブチャートとして描画されます。この文書では、各チャートでのデータ加工方法を詳しく説明します。

### Small Multiples（スモールマルチプル）

この手法は、データ可視化の分野で**Small Multiples**（スモールマルチプル）と呼ばれる技法です。Edward Tufteによって提唱されたこの手法は、同じ構造の小さなチャートを並べることで、複数のグループやカテゴリを効果的に比較できます。

**Small Multiplesの特徴**:
- 📊 **同じスケール**: すべてのサブチャートが同じ軸スケールを使用
- 🔍 **パターン認識**: 複数のグループ間のパターンや傾向を一目で把握
- 📐 **グリッド配置**: 規則的な格子状レイアウトで整理
- 🎯 **比較容易性**: 視線を大きく動かさずに比較可能

## 共通の処理パターン

### 基本的なデータフロー

1. **グループ化**: `d3.groups()` または `d3.rollups()` を使用してデータをseriesでグループ化
2. **集計**: 各グループの合計値を計算（ソート用）
3. **ソート**: ユーザー指定の基準でグループをソート
4. **グリッド配置**: グループを格子状に配置
5. **個別描画**: 各グループを独立したチャートとして描画

## チャート別詳細

### 1. Bar chart (棒グラフ)

**ファイル位置**: `index.es.js` 行810付近

**データ加工方法**:
```javascript
const nestedData = groups(data, d => d.series).map(d => ({
  data: d,
  totalSize: sum(d[1], d => d.size)
}));
```

**処理の詳細**:
- **グループ化関数**: `d3.groups(data, d => d.series)`
- **戻り値の構造**: `[[seriesName, [dataItems]], ...]`
- **集計**: 各seriesグループの`size`の合計を計算
- **ソートオプション**:
  - `totalDescending`: 合計値の降順
  - `totalAscending`: 合計値の昇順
  - `name`: series名のアルファベット順
- **グリッド配置**: `gridding()` を使用して複数のバーチャートを格子状に配置
- **用途**: 複数のカテゴリ群を比較する場合（例: 年度別の製品売上）

---

### 2. Bar chart (multi-set) / Bar chart (stacked)

**ファイル位置**: `index.es.js` 行1171, 1511付近

**データ加工方法**:
```javascript
const nestedData = rollups(data, v => v, d => d.series).map(d => ({
  data: d,
  totalSize: sum(d[1], d => d.size)
}));
```

**処理の詳細**:
- **グループ化関数**: `d3.rollups(data, v => v, d => d.series)`
- **戻り値の構造**: `[[seriesName, aggregatedValue], ...]`
- **集計**: 各seriesグループの`size`の合計を計算
- **ソートオプション**:
  - `valueDescending`: 合計値の降順
  - `valueAscending`: 合計値の昇順
  - `name`: series名の順序
- **グリッド配置**: `gridding()` で複数のチャートを配置
- **用途**: 
  - Multi-set: 複数のグループを並べて比較
  - Stacked: 複数のグループを積み上げて全体と内訳を表示

---

### 3. Bubble chart (バブルチャート)

**ファイル位置**: `index.es.js` 行1854付近

**データ加工方法**:
```javascript
const grouped = groups(data, d => d.series);
const reduced = grouped.reduce((map, d) => {
  map[d[0]] = sum(d[1], e => e.size);
  return map;
}, {});
```

**処理の詳細**:
- **グループ化関数**: `d3.groups(data, d => d.series)`
- **追加処理**: `reduce()` で各seriesの合計値をマップに変換
- **ソートオプション**:
  - `Total value (descending)`: 合計値の降順
  - `Total value (ascending)`: 合計値の昇順
  - `Name`: series名の順序
- **特徴**: バブルの大きさと位置で多次元データを表現
- **用途**: 複数のグループの分布を比較（例: 地域別の人口分布）

---

### 4. Beeswarm plot (ビースウォーム)

**ファイル位置**: `index.es.js` 行2481付近

**データ加工方法**:
```javascript
const nestedData = groups(data, d => d.series);
nestedData.forEach(function (serie) {
  serie.totalValue = data.filter(item => item.series == serie[0])
    .reduce((result, item) => result + mapping.size.value ? item.size : 1, 0);
});
```

**処理の詳細**:
- **グループ化関数**: `d3.groups(data, d => d.series)`
- **集計**: 各seriesの`totalValue`プロパティを追加
- **ソートオプション**:
  - `totalDescending`: 合計値の降順
  - `totalAscending`: 合計値の昇順
  - `name`: series名の順序
- **グリッド配置**: 各グループを独立したビースウォームプロットとして配置
- **特徴**: データポイントの分布を蜂の群れのように表示
- **用途**: **複数のグループの分布パターンを比較**（例: 職業別の賃金分布）

> **注**: Beeswarm plotでは、`series`は実際には「グループ」として機能します。そのため、UIでは「グループ (Groups)」と表示されるように変更されました。

---

### 5. Violin plot (バイオリンプロット)

**ファイル位置**: `index.es.js` 行8089付近

**データ加工方法**:
```javascript
data.forEach(d => {
  d.series = Array.isArray(d.series) ? '' : d.series;
});
const nestedData = groups(data, d => d.series);
```

**処理の詳細**:
- **前処理**: 配列の場合は空文字列に変換
- **グループ化関数**: `d3.groups(data, d => d.series)`
- **グリッド配置**: `gridding()` で複数のバイオリンプロットを配置
- **特徴**: データの分布を密度曲線で表現
- **用途**: 複数のグループの分布形状を比較（例: 年齢層別の収入分布）

---

## データ加工の比較表

| チャート | グループ化関数 | 集計方法 | ソート基準 | 主な用途 |
|---------|--------------|---------|-----------|---------|
| **Bar chart** | `groups()` | `sum(size)` | 合計値/名前 | カテゴリ群の比較 |
| **Bar chart (multi-set)** | `rollups()` | `sum(size)` | 合計値/名前 | グループの並列比較 |
| **Bar chart (stacked)** | `rollups()` | `sum(size)` | 合計値/名前 | グループの積み上げ比較 |
| **Bubble chart** | `groups()` + `reduce()` | `sum(size)` → map | 合計値/名前 | 多次元分布の比較 |
| **Beeswarm plot** | `groups()` | カスタム集計 | 合計値/名前 | **分布パターンの比較** |
| **Violin plot** | `groups()` | なし | なし | 分布形状の比較 |

## d3.groups() vs d3.rollups() の違い

### `d3.groups(data, keyFunc)`
- **戻り値**: `[[key, [values]], ...]`
- **特徴**: 元のデータ配列をそのまま保持
- **使用例**: Bar chart, Bubble chart, Beeswarm, Violin

### `d3.rollups(data, reduceFunc, keyFunc)`
- **戻り値**: `[[key, reducedValue], ...]`
- **特徴**: 集約関数を適用した結果を保持
- **使用例**: Bar chart (multi-set), Bar chart (stacked)

## グリッド配置の仕組み

すべてのチャートで`gridding()`関数を使用してseriesグループを格子状に配置:

```javascript
const gridding = gridding()
  .size([width, height])
  .mode('grid')
  .padding(0)
  .cols(columnsNumber);  // ユーザー指定の列数

const griddingData = gridding(nestedData);
```

**配置結果**:
- 各グループに`x`, `y`, `width`, `height`プロパティが追加される
- SVGの`transform`属性で各グループを配置
- ユーザーは列数を指定可能

## まとめ

`series`ビジュアル変数は、すべてのチャートで**データのグループ化**に使用されます。各グループは独立したサブチャートとして描画され、複数のグループを並べて比較することができます。

**Beeswarm plotでの特別な意味**:
- 他のチャートと同様にグループ化に使用
- 分布パターンの比較に特化
- UIでは「グループ (Groups)」と表示される（より直感的）
