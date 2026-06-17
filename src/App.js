import './utils/extendColorPresets'
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  getOptionsConfig,
  getDefaultOptionsValues,
} from '@rawgraphs/rawgraphs-core'

// import HeaderItems from './HeaderItems'
// import Header from './components/Header'
import Section from './components/Section'
import Footer from './components/Footer'
import ScreenSizeAlert from './components/ScreenSizeAlert'

import DataLoader from './components/DataLoader'
import chartsRaw, { localizeCharts } from './charts'
import ChartSelector from './components/ChartSelector'
import DataMapping from './components/DataMapping'
import ChartPreviewWithOptions from './components/ChartPreviewWIthOptions'
import Exporter from './components/Exporter'
import get from 'lodash/get'
import usePrevious from './hooks/usePrevious'
import useDataLoader from './hooks/useDataLoader'
import CookieConsent from 'react-cookie-consent'
import { useTranslation } from 'react-i18next'
import {
  findRecommendedRawgraphsChartId,
  getCompatibleToolsForDataUrl,
  getRawgraphsCatalogUrl,
} from './utils/rawgraphsCatalog'
import useToolHeaderIntegration from './hooks/useToolHeaderIntegration'
import useRawgraphsProject from './hooks/useRawgraphsProject'
import useToolHeaderToasts from './hooks/useToolHeaderToasts'
import useInitialUrlLoad from './hooks/useInitialUrlLoad'

// import FixedHeader from './components/FixedHeader/FixedHeader'

function App() {
  const { t, i18n } = useTranslation()
  const charts = useMemo(
    () => localizeCharts(chartsRaw, i18n.language),
    [i18n.language]
  )
  const dataLoader = useDataLoader()
  const { data, loading } = dataLoader

  /* From here on, we deal with viz state */
  const [currentChart, setCurrentChart] = useState(null)
  const [mapping, setMapping] = useState({})
  const [visualOptions, setVisualOptions] = useState({})
  const [rawViz, setRawViz] = useState(null)
  const [mappingLoading, setMappingLoading] = useState(false)
  const dataMappingRef = useRef(null)
  const catalogEntriesRef = useRef(null)

  const {
    showHeaderMessage,
    showProcessingToast,
    installHeaderProcessingToasts,
  } = useToolHeaderToasts(t)

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

  //resetting mapping when column names changes (ex: separator change in parsing)
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
      setMapping({})
      clearLocalMapping()
      setCurrentChart(nextChart)
      const options = getOptionsConfig(nextChart?.visualOptions)
      setVisualOptions(getDefaultOptionsValues(options))
      setRawViz(null)
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

  const getCatalogEntries = useCallback(async () => {
    if (catalogEntriesRef.current) return catalogEntriesRef.current

    const res = await fetch(getRawgraphsCatalogUrl())
    if (!res.ok) throw new Error(`catalog fetch failed: ${res.status}`)

    const catalog = await res.json()
    catalogEntriesRef.current = catalog.entries || []
    return catalogEntriesRef.current
  }, [])

  const resolveCompatibleToolsForDataUrl = useCallback(
    async (dataUrl) => {
      const entries = await getCatalogEntries()
      return getCompatibleToolsForDataUrl(entries, dataUrl)
    },
    [getCatalogEntries]
  )

  const {
    currentProjectId,
    currentProjectName,
    setCurrentProjectId,
    setCurrentProjectName,
    exportProject,
    importProject,
    importSerializedProject,
    getThumbnailDataUri,
  } = useRawgraphsProject({
    charts,
    dataLoader,
    currentChart,
    setCurrentChart,
    mapping,
    setMapping,
    visualOptions,
    setVisualOptions,
    rawViz,
  })

  const loadSampleRef = useToolHeaderIntegration({
    t,
    currentProjectId,
    currentProjectName,
    exportProject,
    getThumbnailDataUri,
    importSerializedProject,
    loadSample: dataLoader.loadSample,
    applyRecommendedRawgraphsChart,
    installHeaderProcessingToasts,
    showProcessingToast,
    setCurrentProjectId,
    setCurrentProjectName,
  })

  useInitialUrlLoad({
    t,
    loadSampleRef,
    resolveCompatibleToolsForDataUrl,
    applyRecommendedRawgraphsChart,
    importSerializedProject,
    installHeaderProcessingToasts,
    showProcessingToast,
    showHeaderMessage,
    setCurrentProjectId,
  })

  //setting initial chart and related options
  useEffect(() => {
    if (currentChart || !charts[0]) return
    setCurrentChart(charts[0])
    const options = getOptionsConfig(charts[0]?.visualOptions)
    setVisualOptions(getDefaultOptionsValues(options))
  }, [charts, currentChart])

  return (
    <div className="App">
      {/* <FixedHeader /> */}
      {/* <Header menuItems={HeaderItems} /> */}
      <div className="app-sections" style={{ marginTop: '96px' }}>
        <Section title={t('app.section1')} loading={loading}>
          <DataLoader {...dataLoader} hydrateFromProject={importProject} />
        </Section>
        {data && (
          <Section title={t('app.section2')}>
            <ChartSelector
              availableCharts={charts}
              currentChart={currentChart}
              setCurrentChart={handleChartChange}
            />
          </Section>
        )}
        {data && currentChart && (
          <Section title={t('app.section3')} loading={mappingLoading}>
            <DataMapping
              ref={dataMappingRef}
              dimensions={currentChart.dimensions}
              dataTypes={data.dataTypes}
              mapping={mapping}
              setMapping={setMapping}
            />
          </Section>
        )}
        {data && currentChart && (
          <Section title={t('app.section4')}>
            <ChartPreviewWithOptions
              chart={currentChart}
              dataset={data.dataset}
              dataTypes={data.dataTypes}
              mapping={mapping}
              visualOptions={visualOptions}
              setVisualOptions={setVisualOptions}
              setRawViz={setRawViz}
              setMappingLoading={setMappingLoading}
            />
          </Section>
        )}
        {data && currentChart && rawViz && (
          <Section title={t('app.section5')}>
            <Exporter rawViz={rawViz} />
          </Section>
        )}
        <Footer />
        <CookieConsent
          location="bottom"
          buttonText={t('app.cookie.accept')}
          style={{ background: '#f5f5f5', color: '#646467' }}
          buttonStyle={{
            background: '#646467',
            color: 'white',
            fontSize: '13px',
            borderRadius: '3px',
            padding: '5px 20px',
          }}
          buttonClasses="btn btn-default btn-grey"
          acceptOnScroll={true}
        >
          {t('app.cookie.message')}{' '}
          <a
            href="https://rawgraphs.io/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-body border-bottom border-dark"
          >
            {t('app.cookie.learnMore')}
          </a>
        </CookieConsent>
      </div>
      <ScreenSizeAlert />
    </div>
  )
}

export default App
