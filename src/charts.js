import {
  alluvialdiagram,
  arcdiagram,
  barchart,
  barchartmultiset,
  barchartstacked,
  beeswarm,
  boxplot,
  bubblechart,
  bumpchart,
  circlepacking,
  circularDendrogram,
  contourPlot,
  convexHull,
  dendrogram,
  ganttChart,
  hexagonalBinning,
  horizongraph,
  linechart,
  matrixplot,
  parallelcoordinates,
  radarchart,
  sankeydiagram,
  slopechart,
  streamgraph,
  sunburst,
  treemap,
  violinplot,
  voronoidiagram,
  chorddiagram,
  piechart,
  voronoitreemap,
} from '@rawgraphs/rawgraphs-charts'
import { calendarHeatmap } from '@rawgraphs/rawgraphs-calendar-heatmap'

// New charts, not included into first release.
// Comment at necessity.
let charts = [
  alluvialdiagram,
  arcdiagram,
  barchart,
  barchartmultiset,
  barchartstacked,
  beeswarm,
  boxplot,
  bubblechart,
  bumpchart,
  calendarHeatmap,
  chorddiagram,
  circlepacking,
  circularDendrogram,
  contourPlot,
  convexHull,
  dendrogram,
  ganttChart,
  hexagonalBinning,
  horizongraph,
  linechart,
  matrixplot,
  parallelcoordinates,
  piechart,
  radarchart,
  sankeydiagram,
  slopechart,
  streamgraph,
  sunburst,
  treemap,
  violinplot,
  voronoidiagram,
  voronoitreemap,
]

// 日本語説明文の翻訳
const chartDescriptions = {
  'rawgraphs.alluvialdiagram': '関連のある項目（ノード）同士を、流れる線（リンク）でつないで見せるチャートです。四角形はそれぞれの項目（ノード）を表し、その高さは項目の大きさ（数や量）を表します。項目同士のつながりは曲がった線で表され、線の太さはつながりの強さ（数の多さ）を表しています。',
  'rawgraphs.arcdiagram': '項目（ノード）同士のつながり（リンク）を見やすく表示します。項目は点として横一列に並べられ、項目間のつながりは半円の線（アーク）で表されます。項目の上側に描かれる半円は左から右への関係を、下側に描かれる半円は右から左への関係を表しています。',
  'rawgraphs.barchart': '項目ごとの数量を棒の長さで表すチャートです。それぞれの棒は一つの項目（カテゴリー）を表し、棒の長さはその項目の数や量の大きさを表しています。',
  'rawgraphs.barchartmultiset': '1つの項目に対して複数の数値を比較できる棒グラフです。項目ごとに複数の棒がセットになって並んでおり、それぞれの棒は異なる種類の数値を表しています。棒の高さでそれぞれの数値の大きさを比較できます。',
  'rawgraphs.barchartstacked': '1つの項目に対して複数の数値を積み重ねて表示する棒グラフです。それぞれの項目の棒は、複数の部分に分かれて色分けされており、各部分の高さがそれぞれの数値の大きさを表しています。全体の高さで合計値も一目でわかります。',
  'rawgraphs.beeswarm': 'データの分布を蜂の群れのような形で表すグラフです。それぞれのデータは点で表され、横軸上の位置で値を示します。点が重ならないように上下にずらして配置することで、同じような値のデータがどれくらいあるかが見えます。点の大きさで別の数値を、色で別の数値や分類を表すこともできます。',
  'rawgraphs.boxplot': 'データのばらつき具合を箱とひげで表すグラフです。データを5つの重要な値でまとめて表示します：最小値（一番小さい値）、下位25％の位置の値、中央値（真ん中の値）、上位25％の位置の値、最大値（一番大きい値）。箱の部分に全体の半分のデータが含まれ、ひげの部分で全体の範囲がわかります。',
  'rawgraphs.bubblechart': '散布図を基本とした、円（泡）で表すグラフです。横軸と縦軸の2つの数値の関係を見ることができます。さらに、円の大きさで3つ目の数値を表し、円の色で4つ目の数値や分類を表すことができます。一度に4つの情報を見比べることができる便利なグラフです。',
  'rawgraphs.bumpchart': '複数の項目の順位が時間とともにどう変化するかを見るチャートです。それぞれの項目は線で表され、横軸の各地点での順位の変動を追うことができます。通常、各項目の大きさ（数値）によって順位が決まり、順位の入れ替わりが線の交差で表現されます。',
  'rawgraphs.circlepacking': 'ツリー構造のあるデータを、円の中に円を入れ子にして表すグラフです。一番小さい円（末端の項目）の面積でその項目の値の大きさを表します。大きな円の中に小さな円が入っている形で、グループや階層の関係がわかります。円の大きさで数値を、色で別の数値や分類を表すこともできます。',
  'rawgraphs.circulardendrogram': 'ツリー構造を持つデータを、中心から外側に向かって枝分かれする円形の木のような形で表すグラフです。一番元となる項目（根）が中心にあり、そこから外側に向かって枝分かれしていきます。点（ノード）の大きさで数値を表し、色で別の数値や分類を表すこともできます。家系図のような階層関係を円形に配置したものと考えるとわかりやすいです。',
  'rawgraphs.contourplot': 'たくさんのデータ点が集まっている場所の密度を、地形図のような線で表すチャートです。データが多すぎて点が重なって見えにくくなる問題を解決するのに便利です。データが密集している場所ほど線が詰まって表示され、山の等高線のように、データがどこに集中しているかが一目でわかります。',
  'rawgraphs.convexhull': '散布図上の点のグループを囲む、最も小さな外枠を描くチャートです。輪ゴムを点の集まりの周りに張ったときにできる形をイメージするとわかりやすいです。同じ仲間の点をまとめて囲むことで、どの点が同じグループに属しているかを視覚的に示すのに便利です。',
  'rawgraphs.lineardendrogram': 'ツリー構造を持つデータを、左から右に枝分かれする木のような形で表すグラフです。一番元となる項目（根）が左側にあり、そこから右に向かって枝分かれしていき、末端の項目（葉）が右端に並びます。点（ノード）の大きさで数値を表し、色で別の数値や分類を表すこともできます。組織図や分類図のような階層関係を横向きに表示したものです。',
  'rawgraphs.ganttChart': 'プロジェクトのスケジュールを棒グラフで表したものです。各作業がいつ始まっていつ終わるかを横棒で表示し、プロジェクト全体の進行状況が一目でわかります。それぞれの棒は一つの作業を表し、棒の左端が開始日、右端が終了日を示します。複数の作業の関係や全体の流れを把握するのに便利です。',
  'rawgraphs.hexagonalbinning': 'たくさんの点が重なって見えにくくなる問題を解決するチャートです。個々の点を表示する代わりに、画面を六角形のマス目に区切って、それぞれの六角形の中に何個の点があるかを表示します。点が多い場所ほど六角形の色を濃くしたり、六角形を大きくしたりして、データがどこに集中しているかを見やすくします。ハチの巣のような形でデータの密度を表現するグラフです。',
  'rawgraphs.horizongraph': '時間の経過に沿った数値の変化を、省スペースで表示するグラフです。通常の折れ線グラフを上下に圧縮して、色の濃さで値の大きさを表現します。値が大きくなるほど色が濃くなり、複数の層を重ねたような見た目になります。たくさんのデータを縦に並べて比較したいときに、場所を取らずに表示できる便利なグラフです。',
  'rawgraphs.linechart': '時間の経過や連続した範囲での数値の変化を、線でつないで表すチャートです。横軸に時間や連続した値を、縦軸に数値を配置し、各時点のデータを点で打って線でつなぎます。複数の線を色分けして表示することで、異なる項目の変化を同時に比較することもできます。最も基本的で、変化の様子がわかりやすいグラフです。',
  'rawgraphs.matrixplot': '2つの項目グループの組み合わせを、縦横の表のような形で比較するチャートです。横軸に1つ目の項目グループ、縦軸に2つ目の項目グループを並べ、それぞれの交差する場所に四角や円を置きます。この四角や円は、2つの項目の関係を表しています。関係の強さは、図形の大きさや色の濃さで表現できます。相関関係を総当たりで確認したいときに便利なグラフです。',
  'rawgraphs.parallelcoordinates': '複数の項目の値を同時に比較できるグラフです。それぞれの項目を縦の軸として横に並べ、1つのデータは各軸上の値を線でつないで表します。例えば、ある商品の「価格」「品質」「人気度」などを別々の軸に配置し、各商品がそれぞれの軸でどんな値を持つかを1本の線でつなぎます。多くのデータの線のパターンを見ることで、似た特徴を持つグループを見つけることができます。',
  'rawgraphs.radarchart': '複数の項目を中心から放射状に伸びる軸で表すグラフです。中心から外側に向かって複数の軸が伸びています。それぞれの軸は異なる項目（例：攻撃力、防御力、スピードなど）を表し、すべての軸で同じ目盛りを使います。各項目の値を線でつなぐと多角形ができ、その形で全体のバランスや特徴が一目でわかります。ゲームのキャラクター能力表などでよく使われています。',
  'rawgraphs.sankeydiagram': '項目から項目への流れる量を表すチャートです。項目は長方形で表され、その高さは項目の大きさを示します。項目から項目へ流れる量は、曲がった帯のような線で表現され、帯の太さが流れる量の多さを表しています。「流れ」と「量」を同時に見たいときに便利です。川の分岐と合流をイメージするとわかりやすいです。',
  'rawgraphs.slopechart': '2つの時点や状態での値の変化を、線の傾きで表すチャートです。左右に2本の縦軸を配置し、それぞれの軸に各項目の値を表示します。同じ項目の値を線でつなぐことで、値がどう変化したかが一目でわかります。線が上向きなら増加、下向きなら減少、傾きが急なほど変化が大きいことを示します。例えば、今年と去年の売上比較などに使われます。',
  'rawgraphs.streamgraph': '複数の項目の量の変化を、流れるような形の面で表すグラフです。川の流れのような見た目で、それぞれの項目は色分けされた帯として表示されます。時間とともに各項目の量がどう変化するか、また全体に占める割合がどう変わるかを同時に見ることができます。積み上げ面グラフを上下対称にして、より滑らかで美しい形にしたものです。',
  'rawgraphs.sunburst': 'ツリー構造のあるデータを、太陽から放射される光のような形で表すグラフです。中心の円が一番元となる項目で、そこから外側に向かって同心円状に階層が広がっていきます。それぞれの項目は扇形で表され、扇形の角度（幅）がその項目の大きさを表しています。ドーナツを何重にも重ねたような見た目で、内側から外側に向かって、大分類から小分類へと細かく分かれていく様子がわかります。',
  'rawgraphs.treemap': 'ツリー構造のあるデータを、大きな四角形の中に小さな四角形を敷き詰めて表すグラフです。それぞれの小さな四角形は末端の項目を表し、四角形の面積がその項目の大きさ（数値）を示します。限られたスペースで多くの項目の大小関係を一度に比較できます。',
  'rawgraphs.violinplot': 'データがどのように分布しているかを、バイオリンのような形で表すチャートです。形が太い部分はそのあたりの値を持つデータが多く、細い部分はデータが少ないことを示します。箱ひげ図よりも詳しく、データがどこに集中しているかを滑らかな曲線で見ることができます。',
  'rawgraphs.voronoidiagram': 'それぞれの点の周りに、その点が一番近い領域を作って表示するグラフです。散布図上の各点を中心に、画面を仕切りで区切ったような見た目になります。点と点の間の距離や、それぞれの点の勢力範囲を視覚的に理解するのに便利です。',
  'rawgraphs.chorddiagram': '項目間の相互関係を円環状に配置し、紐（コード）で結んで関係の強さを表すチャートです。項目は円周上に配置され、項目間のつながりは円の中を通る曲線で表されます。紐の太さが関係の強さや量を表しており、複雑なネットワーク関係をコンパクトに可視化するのに適しています。',
  'rawgraphs.piechart': '全体に対する各部分の割合を扇形の面積で表すチャートです。円全体を100%とし、各項目の構成比率を扇形の中心角の大きさで表現します。カテゴリーごとのシェアや比率を一目で比較するのに最も一般的なグラフです。',
  'rawgraphs.voronoitreemap': 'ツリー構造のあるデータを、多角形の領域分割（ボロノイ分割）で表すチャートです。通常のツリーマップのような四角形ではなく、有機的な形の多角形で領域を分割し、その面積で値の大きさを表します。階層構造を持ちながらも、より柔軟で自然な見た目の分割表現が可能です。',
  'rawgraphs.calendarheatmap': 'カレンダーの日付に合わせてデータを色の濃淡で表示するチャートです。1年間全体を見渡して、特定の時期や曜日による傾向やパターン（シーズナリティ）を見つけるのに適しています。GitHubのコントリビューショングラフのように、日々の活動量などを可視化時によく使われます。'
}

const chartNameOverrides = {
  'rawgraphs.streamgraph': 'Streamgraph',
}

// チャート変数の日本語翻訳定義
const dimensionTranslations = {
  'x': 'X軸',
  'y': 'Y軸',
  'xValue': 'X軸（xValue）',
  'size': 'サイズ (大きさ)',
  'color': '色',
  'label': 'ラベル',
  'series': 'シリーズ (系列)',
  'bars': 'バー (Bars)',
  'stacks': 'X軸 (Stacks)',
  'steps': 'ステップ (Steps)',
  'arcs': 'アーク (Arcs)',
  'lines': 'ライン (Lines)',
  'streams': 'ストリーム (Streams)',
  'hierarchy': '階層 (Hierarchy)',
  'source': 'ソース (始点)',
  'target': 'ターゲット (終点)',
  'date': '日付',
  'startDate': '開始日',
  'endDate': '終了日',
  'groups': 'グループ',
  'connectedBy': '接続キー（connectedBy）',
  'value': '値',
  'weight': '重み',
  'dimensions': '次元 (Dimensions)',
  'axes': '軸 (Axes)',
  'sets': 'セット (Sets)',
}

// チャートの説明文と変数を日本語に上書き
charts = charts.map(chart => {
  let newChart = { ...chart }

  // 説明文の翻訳
  const description = chartDescriptions[chart.metadata.id]
  if (description) {
    newChart = {
      ...newChart,
      metadata: {
        ...newChart.metadata,
        description: description
      }
    }
  }

  const nameOverride = chartNameOverrides[chart.metadata.id]
  if (nameOverride) {
    newChart = {
      ...newChart,
      metadata: {
        ...newChart.metadata,
        displayName: nameOverride
      }
    }
  }

  // 変数名の翻訳
  if (newChart.dimensions) {
    newChart = {
      ...newChart,
      dimensions: newChart.dimensions.map(dim => {
        const trans = dimensionTranslations[dim.id]
        if (trans) {
          return { ...dim, name: trans }
        }
        return dim
      })
    }
  }

  return newChart
})

export default charts
