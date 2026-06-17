import './utils/extendColorPresets'
import React, { useMemo } from 'react'

import Footer from './components/Footer'
import ScreenSizeAlert from './components/ScreenSizeAlert'

import chartsRaw, { localizeCharts } from './charts'
import useDataLoader from './hooks/useDataLoader'
import CookieConsent from 'react-cookie-consent'
import { useTranslation } from 'react-i18next'
import useToolHeaderIntegration from './hooks/useToolHeaderIntegration'
import useRawgraphsProject from './hooks/useRawgraphsProject'
import useToolHeaderToasts from './hooks/useToolHeaderToasts'
import useInitialUrlLoad from './hooks/useInitialUrlLoad'
import useChartWorkflow from './hooks/useChartWorkflow'
import useRawgraphsCatalog from './hooks/useRawgraphsCatalog'
import RawgraphsWorkflowSections from './components/RawgraphsWorkflowSections'

// import FixedHeader from './components/FixedHeader/FixedHeader'

function App() {
  const { t, i18n } = useTranslation()
  const charts = useMemo(
    () => localizeCharts(chartsRaw, i18n.language),
    [i18n.language]
  )
  const dataLoader = useDataLoader()
  const { data, loading } = dataLoader

  const {
    showHeaderMessage,
    showProcessingToast,
    installHeaderProcessingToasts,
  } = useToolHeaderToasts(t)

  const {
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
  } = useChartWorkflow({ charts, data })

  const { resolveCompatibleToolsForDataUrl } = useRawgraphsCatalog()

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
    showHeaderMessage,
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

  return (
    <div className="App">
      {/* <FixedHeader /> */}
      <div className="app-sections" style={{ marginTop: '96px' }}>
        <RawgraphsWorkflowSections
          t={t}
          loading={loading}
          dataLoader={dataLoader}
          importProject={importProject}
          data={data}
          charts={charts}
          currentChart={currentChart}
          handleChartChange={handleChartChange}
          mappingLoading={mappingLoading}
          dataMappingRef={dataMappingRef}
          mapping={mapping}
          setMapping={setMapping}
          visualOptions={visualOptions}
          setVisualOptions={setVisualOptions}
          setRawViz={setRawViz}
          setMappingLoading={setMappingLoading}
          rawViz={rawViz}
        />
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
