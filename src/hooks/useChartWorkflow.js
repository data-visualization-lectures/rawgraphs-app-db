import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import {
  getOptionsConfig,
  getDefaultOptionsValues,
} from '@rawgraphs/rawgraphs-core'
import get from 'lodash/get'
import usePrevious from './usePrevious'
import { findRecommendedRawgraphsChartId } from '../utils/rawgraphsCatalog'

export default function useChartWorkflow({ charts, data }) {
  const [currentChart, setCurrentChart] = useState(null)
  const [mapping, setMapping] = useState({})
  const [visualOptions, setVisualOptions] = useState({})
  const [rawViz, setRawViz] = useState(null)
  const [mappingLoading, setMappingLoading] = useState(false)
  const dataMappingRef = useRef(null)

  const columnNames = useMemo(() => {
    if (get(data, 'dataTypes')) {
      return Object.keys(data.dataTypes)
    }
  }, [data])

  const prevColumnNames = usePrevious(columnNames)
  const clearLocalMapping = useCallback(() => {
    if (dataMappingRef.current) {
      dataMappingRef.current.clearLocalMapping()
    }
  }, [])

  useEffect(() => {
    if (prevColumnNames) {
      if (!columnNames) {
        setMapping({})
        clearLocalMapping()
      } else {
        const prevCols = prevColumnNames.join('.')
        const currentCols = columnNames.join('.')
        if (prevCols !== currentCols) {
          setMapping({})
          clearLocalMapping()
        }
      }
    }
  }, [columnNames, prevColumnNames, clearLocalMapping])

  const handleChartChange = useCallback(
    (nextChart) => {
      // The chart, its mapping and its options must change in one update.
      // This function is also called outside React event handlers (when a
      // sample is picked in the tool header), where each state change would
      // otherwise render on its own: the new chart would be drawn once with
      // the mapping and the options of the previous one.
      unstable_batchedUpdates(() => {
        setMapping({})
        clearLocalMapping()
        setCurrentChart(nextChart)
        const options = getOptionsConfig(nextChart?.visualOptions)
        setVisualOptions(getDefaultOptionsValues(options))
        setRawViz(null)
      })
    },
    [clearLocalMapping]
  )

  const applyRecommendedRawgraphsChart = useCallback(
    (compatibleTools) => {
      const chartId = findRecommendedRawgraphsChartId(compatibleTools)
      if (!chartId) return false

      const nextChart = charts.find((chart) => chart.metadata?.id === chartId)
      if (!nextChart) return false

      handleChartChange(nextChart)
      return true
    },
    [charts, handleChartChange]
  )

  useEffect(() => {
    if (currentChart || !charts[0]) return
    setCurrentChart(charts[0])
    const options = getOptionsConfig(charts[0]?.visualOptions)
    setVisualOptions(getDefaultOptionsValues(options))
  }, [charts, currentChart])

  return {
    currentChart,
    setCurrentChart,
    mapping,
    setMapping,
    visualOptions,
    setVisualOptions,
    rawViz,
    setRawViz,
    mappingLoading,
    setMappingLoading,
    dataMappingRef,
    handleChartChange,
    applyRecommendedRawgraphsChart,
  }
}
