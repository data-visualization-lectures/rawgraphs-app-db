import React, { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useDebounce from '../../hooks/useDebounce'
import WarningMessage from '../WarningMessage'
import { getChartPreviewValidationError } from './ChartPreviewValidation'
import {
  getChartRenderError,
  renderRawChartToDOM,
} from './ChartPreviewRenderer'

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

    const validationError = getChartPreviewValidationError({
      chart,
      mapping,
      t,
    })
    if (validationError) {
      setError(validationError)
      clearPreview()
      return
    }

    if (!mappedData) {
      clearPreview()
      return
    }

    try {
      const rawViz = renderRawChartToDOM({
        chart,
        data,
        dataTypes,
        domNode: domRef.current,
        mappedData,
        mapping,
        visualOptions: vizOptionsDebounced,
      })
      setRawViz(rawViz)
      setError(null)
    } catch (e) {
      setError(getChartRenderError(e, t))
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
