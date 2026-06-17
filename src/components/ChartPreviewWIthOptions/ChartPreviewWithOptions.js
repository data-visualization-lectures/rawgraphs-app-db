import React, { useState, useEffect } from 'react'
import { Row } from 'react-bootstrap'
import ChartOptions from '../ChartOptions'
import ChartPreview from '../ChartPreview'
import { chart as rawChart } from '@rawgraphs/rawgraphs-core'
import { mapDataInWorker } from '../../worker'
import { WEBWORKER_ACTIVE } from '../../constants'

const ChartPreviewWithOptions = ({
  chart,
  dataset,
  dataTypes,
  mapping,
  visualOptions,
  setVisualOptions,
  setRawViz,
  setMappingLoading,
}) => {
  const [error, setError] = useState({
    variant: 'secondary',
    message: 'Required chart variables',
  })
  const [mappedData, setMappedData] = useState(null)

  useEffect(() => {
    let isCurrent = true

    const updateMappedData = async () => {
      setMappingLoading(true)
      try {
        const nextMappedData = WEBWORKER_ACTIVE
          ? await mapDataInWorker(chart.metadata.name, {
              data: dataset,
              mapping,
              dataTypes,
            })
          : rawChart(chart, {
              data: dataset,
              mapping,
              dataTypes,
            })._getVizData()

        if (!isCurrent) return
        setMappedData(nextMappedData)
      } catch (err) {
        if (!isCurrent) return
        console.error(err)
        setMappedData(null)
        setRawViz(null)
      } finally {
        if (isCurrent) {
          setMappingLoading(false)
        }
      }
    }

    updateMappedData()

    return () => {
      isCurrent = false
    }
  }, [chart, mapping, dataTypes, setRawViz, setMappingLoading, dataset])

  return (
    <Row>
      <ChartOptions
        chart={chart}
        dataset={dataset}
        mapping={mapping}
        dataTypes={dataTypes}
        visualOptions={visualOptions}
        setVisualOptions={setVisualOptions}
        error={error}
        mappedData={mappedData}
      />
      <ChartPreview
        chart={chart}
        dataset={dataset}
        dataTypes={dataTypes}
        mapping={mapping}
        visualOptions={visualOptions}
        error={error}
        setError={setError}
        setRawViz={setRawViz}
        mappedData={mappedData}
      />
    </Row>
  )
}

export default ChartPreviewWithOptions
