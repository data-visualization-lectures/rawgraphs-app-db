import React, { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { chart as rawChart } from '@rawgraphs/rawgraphs-core'
import useDebounce from '../../hooks/useDebounce'
import WarningMessage from '../WarningMessage'

const ERROR_MESSAGE_MAP = [
  {
    pattern:
      /Paddings are too high, decrase them in the "chart" options panel/i,
    key: 'chartPreview.error.paddingsTooHigh',
  },
  {
    pattern: /Selected project is not valid/i,
    key: 'chartPreview.error.invalidProject',
  },
  {
    pattern: /Invalid version number, please use a suitable deserializer/i,
    key: 'chartPreview.error.invalidVersion',
  },
  {
    pattern: /Unknown chart!/i,
    key: 'chartPreview.error.unknownChart',
  },
  {
    pattern: /No serializer found for version (.+)/i,
    key: 'chartPreview.error.noSerializer',
    params: (m) => ({ version: m[1] }),
  },
  {
    pattern: /Can't open your project\. Invalid file/i,
    key: 'chartPreview.error.cantOpenInvalid',
  },
  {
    pattern: /Can't open your project\. (.+)/i,
    key: 'chartPreview.error.cantOpen',
    params: (m) => ({ detail: m[1] }),
  },
]

function translateErrorMessage(msg, t) {
  const message = msg ? String(msg) : ''
  for (const { pattern, key, params } of ERROR_MESSAGE_MAP) {
    const m = message.match(pattern)
    if (m) return t(key, params ? params(m) : {})
  }
  return message
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
  const { t } = useTranslation()
  const domRef = useRef(null)

  const vizOptionsDebounced = useDebounce(visualOptions, 200)

  useEffect(() => {
    const clearPreview = () => {
      setRawViz(null)
      if (!domRef.current) return
      while (domRef.current.firstChild) {
        domRef.current.removeChild(domRef.current.firstChild)
      }
    }

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
          {t('chartPreview.requiredVars')}{' '}
          {requiredVariables
            .map((d, i) => (
              <span key={i} className="font-weight-bold">
                {d.name}
              </span>
            ))
            .reduce((prev, curr) => [prev, ' and ', curr])}
          {t('chartPreview.pleaseMap')}
        </span>
      )
      setError({ variant: 'secondary', message: errorMessage })
      clearPreview()
      return
    }

    // control multiple required variables
    const multivaluesVariables = chart.dimensions.filter(
      (d) =>
        d.multiple &&
        d.required &&
        d.minValues &&
        (mapping[d.id]?.ids?.length ?? 0) < d.minValues
    )
    if (multivaluesVariables.length > 0) {
      let errorMessage = (
        <span>
          <span className="font-weight-bold">
            {multivaluesVariables
              .map((d) => (
                <React.Fragment key={d.id}>
                  <span className="font-weight-bold">{d.name}</span>
                  {t('chartPreview.minValues')}
                  <span className="font-weight-bold">{d.minValues}</span>
                  {t('chartPreview.minValuesUnit')}
                </React.Fragment>
              ))
              .reduce((prev, curr) => [prev, ' & ', curr])}
          </span>
          {t('chartPreview.pleaseMapMulti')}
        </span>
      )
      setError({ variant: 'secondary', message: errorMessage })
      clearPreview()
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
        const errorMessage = t('chartPreview.typeMismatch', {
          name: variableObj?.name || variable,
          type: mapping[variable].mappedType,
        })
        setError({ variant: 'danger', message: errorMessage })
        clearPreview()
        return
      }
    }

    if (!mappedData) {
      clearPreview()
      return
    }

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
        setError({
          variant: 'danger',
          message:
            t('chartPreview.chartError') + translateErrorMessage(e.message, t),
        })
        clearPreview()
      }
    } catch (e) {
      setError({
        variant: 'danger',
        message:
          t('chartPreview.chartError') + translateErrorMessage(e.message, t),
      })
      clearPreview()
    }
  }, [
    setError,
    vizOptionsDebounced,
    setRawViz,
    mappedData,
    chart,
    data,
    dataTypes,
    mapping,
    t,
  ])

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
