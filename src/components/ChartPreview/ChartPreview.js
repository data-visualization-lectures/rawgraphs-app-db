import React, { useRef, useEffect } from 'react'
import { chart as rawChart } from '@rawgraphs/rawgraphs-core'
import useDebounce from '../../hooks/useDebounce'
import WarningMessage from '../WarningMessage'

// 既知の英語エラーメッセージを日本語に変換するマップ
const ERROR_MESSAGE_MAP = [
  // --- rawgraphs-charts ---
  {
    pattern: /Paddings are too high, decrase them in the "chart" options panel/i,
    ja: 'パディングの値が大きすぎます。「チャート」オプションパネルで値を小さくしてください。',
  },

  // --- rawgraphs-core: プロジェクト読み込み ---
  {
    pattern: /Selected project is not valid/i,
    ja: '選択されたプロジェクトファイルが無効です。',
  },
  {
    pattern: /Invalid version number, please use a suitable deserializer/i,
    ja: 'バージョン番号が無効です。対応したデシリアライザを使用してください。',
  },
  {
    pattern: /Unknown chart!/i,
    ja: '不明なチャートタイプです。',
  },
  {
    pattern: /No serializer found for version (.+)/i,
    ja: (m) => `バージョン ${m[1]} に対応するシリアライザが見つかりません。`,
  },
  {
    pattern: /Can't open your project\. Invalid file/i,
    ja: 'プロジェクトを開けませんでした。ファイルが無効です。',
  },
  {
    pattern: /Can't open your project\. (.+)/i,
    ja: (m) => `プロジェクトを開けませんでした。${m[1]}`,
  },
]

function translateErrorMessage(msg) {
  for (const { pattern, ja } of ERROR_MESSAGE_MAP) {
    const m = msg.match(pattern)
    if (m) return typeof ja === 'function' ? ja(m) : ja
  }
  return msg
}

const ChartPreview = ({
  chart,
  dataset: data,
  dataTypes,
  mapping,
  visualOptions,
  error,
  setError,
  setRawViz,
  mappedData,
}) => {
  const domRef = useRef(null)

  const vizOptionsDebounced = useDebounce(visualOptions, 200)

  useEffect(() => {
    setError(null)

    // control required variables
    // need to create this array because the prop mapping does not return to {} when data is inserted and removed
    const currentlyMapped = []
    for (let variable in mapping) {
      if (mapping[variable].ids && mapping[variable].ids.length > 0) {
        currentlyMapped.push(variable)
      }
    }

    let requiredVariables = chart.dimensions.filter(
      (d) => d.required && currentlyMapped.indexOf(d.id) === -1
    )

    if (requiredVariables.length > 0) {
      let errorMessage = (
        <span>
          チャート変数が必要です。{' '}
          {requiredVariables
            .map((d, i) => <span key={i} className="font-weight-bold">{d.name}</span>)
            .reduce((prev, curr) => [prev, ' and ', curr])} のマッピングをしてください。
        </span>
      )
      setError({ variant: 'secondary', message: errorMessage })
      setRawViz(null)
      while (domRef.current.firstChild) {
        domRef.current.removeChild(domRef.current.firstChild)
      }
      return
    }

    // control multiple required variables
    const multivaluesVariables = chart.dimensions.filter(
      (d) =>
        d.multiple &&
        d.required &&
        d.minValues &&
        mapping[d.id].ids.length < d.minValues
    )
    if (multivaluesVariables.length > 0) {
      let errorMessage = (
        <span>
          <span className="font-weight-bold">{multivaluesVariables
            .map((d) => (
              <>
                <span className="font-weight-bold">{d.name}</span> には最低 <span className="font-weight-bold">{d.minValues}</span> つの変数
              </>
            ))
            .reduce((prev, curr) => [prev, ' と ', curr])}</span>
          をマッピングしてください。
        </span>
      )
      setError({ variant: 'secondary', message: errorMessage })
      setRawViz(null)
      while (domRef.current.firstChild) {
        domRef.current.removeChild(domRef.current.firstChild)
      }
      return
    }

    // control data-types mismatches
    for (let variable in mapping) {
      if (
        mapping[variable].ids &&
        mapping[variable].ids.length > 0 &&
        !mapping[variable].isValid
      ) {
        const variableObj = chart.dimensions.find((d) => d.id === variable)
        const errorMessage = `データ型の不一致: ${variableObj.name} に ${mapping[variable].mappedType}型をマッピングすることはできません。`
        setError({ variant: 'danger', message: errorMessage })
        setRawViz(null)
        while (domRef.current.firstChild) {
          domRef.current.removeChild(domRef.current.firstChild)
        }
        return
      }
    }

    if (!mappedData) {
      // console.info('Clearing viz')
      setRawViz(null)
      while (domRef.current.firstChild) {
        domRef.current.removeChild(domRef.current.firstChild)
      }
      return
    }
    // console.info('Updating viz')
    try {
      const viz = rawChart(chart, {
        data,
        mapping: mapping,
        dataTypes,
        visualOptions: vizOptionsDebounced,
      })
      try {
        const rawViz = viz.renderToDOM(domRef.current, mappedData)
        setRawViz(rawViz)
        setError(null)
      } catch (e) {
        console.log("chart error", e)
        setError({ variant: 'danger', message: 'チャートエラー: ' + translateErrorMessage(e.message) })
        setRawViz(null)
      }
    } catch (e) {
      while (domRef.current.firstChild) {
        domRef.current.removeChild(domRef.current.firstChild)
      }
      console.log({ e })
      setError({ variant: 'danger', message: 'チャートエラー: ' + translateErrorMessage(e.message) })
      setRawViz(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setError, vizOptionsDebounced, setRawViz, mappedData, chart, mapping])

  return (
    <div className={'col-8 col-xl-9'}>
      <div
        className={['overflow-auto', 'position-sticky'].join(' ')}
        style={{ top: 'calc(15px + var(--header-height))' }}
      >
        {error && (
          <WarningMessage variant={error.variant} message={error.message} />
        )}
        <div ref={domRef}>{/* Don't put content in this <div /> */}</div>
      </div>
    </div>
  )
}

export default React.memo(ChartPreview)
