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
import {
  serializeProject,
  deserializeProject,
} from '@rawgraphs/rawgraphs-core'
import useDataLoader from './hooks/useDataLoader'
import isPlainObject from 'lodash/isPlainObject'
import CookieConsent from 'react-cookie-consent'
import { useTranslation } from 'react-i18next'


// import FixedHeader from './components/FixedHeader/FixedHeader'

function App() {
  const { t, i18n } = useTranslation()
  const charts = useMemo(() => localizeCharts(chartsRaw, i18n.language), [i18n.language])
  const dataLoader = useDataLoader()
  const {
    userInput,
    userData,
    userDataType,
    parseError,
    unstackedData,
    unstackedColumns,
    data,
    separator,
    thousandsSeparator,
    decimalsSeparator,
    locale,
    stackDimension,
    dataSource,
    loading,
    hydrateFromSavedProject,
  } = dataLoader

  /* From here on, we deal with viz state */
  const [currentChart, setCurrentChart] = useState(null)
  const [mapping, setMapping] = useState({})
  const [visualOptions, setVisualOptions] = useState({})
  const [rawViz, setRawViz] = useState(null)
  const [mappingLoading, setMappingLoading] = useState(false)
  const dataMappingRef = useRef(null)

  // Keep a ref to loadSample so tool-header callback can access it
  const loadSampleRef = useRef(dataLoader.loadSample)
  useEffect(() => { loadSampleRef.current = dataLoader.loadSample }, [dataLoader.loadSample])

  // Project management state (for header's save modal)
  const [currentProjectId, setCurrentProjectId] = useState(null)
  const [currentProjectName, setCurrentProjectName] = useState(null)

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

  const exportProject = useCallback(() => {
    return serializeProject({
      userInput,
      userData,
      userDataType,
      parseError,
      unstackedData,
      unstackedColumns,
      data,
      separator,
      thousandsSeparator,
      decimalsSeparator,
      locale,
      stackDimension,
      dataSource,
      currentChart,
      mapping,
      visualOptions,
    })
  }, [
    currentChart,
    data,
    dataSource,
    decimalsSeparator,
    locale,
    mapping,
    parseError,
    separator,
    stackDimension,
    thousandsSeparator,
    userData,
    userDataType,
    userInput,
    visualOptions,
    unstackedColumns,
    unstackedData,
  ])

  // project import
  const importProject = useCallback(
    (project) => {
      hydrateFromSavedProject(project)
      setCurrentChart(project.currentChart)
      setMapping(project.mapping)
      // adding "annotations" for color scale:
      // we annotate the incoming options values (complex ones such as color scales)
      // to le the ui know they are coming from a loaded project
      // so we don't have to re-evaluate defaults
      // this is due to the current implementation of the color scale
      const patchedOptions = { ...project.visualOptions }
      Object.keys(patchedOptions).forEach((k) => {
        if (isPlainObject(patchedOptions[k])) {
          patchedOptions[k].__loaded = true
        }
      })
      setVisualOptions(project.visualOptions)
    },
    [hydrateFromSavedProject]
  )


  // Handle data_url or project_id from URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const dataUrl = params.get('data_url')
    if (dataUrl) {
      fetch(dataUrl)
        .then((res) => res.text())
        .then((text) => {
          const isTsv = dataUrl.endsWith('.tsv')
          if (loadSampleRef.current) {
            loadSampleRef.current(text, isTsv ? '\t' : ',')
          }
        })
        .catch((err) => console.error('data_url load failed:', err))
      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }

    const projectId = params.get('project_id')
    if (!projectId) return

    const doLoad = async () => {
      try {
        await customElements.whenDefined('dataviz-tool-header')
        const header = document.querySelector('dataviz-tool-header')
        const projectData = await header.loadProject(projectId)
        const project = deserializeProject(
          JSON.stringify(projectData),
          charts
        )
        importProject(project)
        setCurrentProjectId(projectId)
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (err) {
        console.error('Project Load Error:', err)
        const header = document.querySelector('dataviz-tool-header')
        if (header && typeof header.showMessage === 'function') {
          header.showMessage(t('app.projectLoadError'), 'error')
        }
      }
    }
    doLoad()
  }, [importProject])



  const getThumbnailDataUri = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!rawViz || !rawViz._node || !rawViz._node.firstChild) {
        resolve(null)
        return
      }
      try {
        const svgString = new XMLSerializer().serializeToString(
          rawViz._node.firstChild
        )
        const svgBlob = new Blob([svgString], {
          type: 'image/svg+xml;charset=utf-8',
        })
        const URL_API = window.URL || window.webkitURL || window
        const url = URL_API.createObjectURL(svgBlob)

        const canvas = document.createElement('canvas')
        canvas.width = rawViz._node.firstChild.clientWidth
        canvas.height = rawViz._node.firstChild.clientHeight
        const ctx = canvas.getContext('2d')

        const img = new Image()
        img.onload = function () {
          ctx.drawImage(img, 0, 0)
          URL_API.revokeObjectURL(url)
          resolve(canvas.toDataURL('image/png'))
        }
        img.onerror = (e) => {
          URL_API.revokeObjectURL(url)
          reject(e)
        }
        img.src = url
      } catch (err) {
        reject(err)
      }
    })
  }, [rawViz])

  // Load Project from File Logic
  const fileInputRef = useRef(null)

  const handleFileLoad = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const projectData = JSON.parse(event.target.result)
        const project = deserializeProject(
          JSON.stringify(projectData),
          charts
        )
        importProject(project)
        // Reset input value to allow reloading the same file
        e.target.value = ''
      } catch (err) {
        console.error('Error loading project:', err)
        const header = document.querySelector('dataviz-tool-header')
        if (header && typeof header.showMessage === 'function') {
          header.showMessage(t('app.projectLoadFailed'), 'error')
        } else {
          alert(t('app.projectLoadFailed'))
        }
      }
    }
    reader.readAsText(file)
  }, [importProject])

  // Configure Tool Header
  useEffect(() => {
    const configureHeader = () => {
      const header = document.querySelector('dataviz-tool-header')
      if (!header) return

      if (typeof header.setConfig === 'function') {
        header.setConfig({
          backgroundColor: '#06c26c',
          logo: {
            type: 'image',
            src: '/logo_rawgraphs.png',
            href: '/',
          },
          buttons: [
            {
              id: 'load-project-btn',
              label: t('app.loadProject'),
              action: () => header.showLoadModal(),
              align: 'right',
            },
            {
              id: 'save-project-btn',
              label: t('app.saveProject'),
              action: async () => {
                const projectData = exportProject()
                const thumbnailDataUri = await getThumbnailDataUri()
                header.showSaveModal({
                  name: currentProjectName || undefined,
                  data: projectData,
                  thumbnailDataUri: thumbnailDataUri,
                  existingProjectId: currentProjectId || undefined,
                })
              },
              align: 'right',
            },
          ],
        })
      }

      if (typeof header.setProjectConfig === 'function') {
        header.setProjectConfig({
          appName: 'rawgraphs',
          onProjectLoad: (projectData) => {
            const project = deserializeProject(
              JSON.stringify(projectData),
              charts
            )
            importProject(project)
          },
          onProjectSave: (meta) => {
            setCurrentProjectId(meta.id)
            setCurrentProjectName(meta.name)
          },
          onProjectDelete: (projectId) => {
            if (currentProjectId === projectId) {
              setCurrentProjectId(null)
              setCurrentProjectName(null)
            }
          },
        })
      }

      // Sample data picker integration
      if (typeof header.setSampleConfig === 'function') {
        header.setSampleConfig({
          toolId: 'rawgraphs',
          chartKey: currentChart?.metadata?.id || null,
          onSampleSelect: (detail) => {
            fetch(detail.url)
              .then((res) => res.text())
              .then((text) => {
                const separator = detail.format === 'tsv' ? '\t' : ','
                if (loadSampleRef.current) {
                  loadSampleRef.current(text, separator)
                }
              })
          },
        })
      }
    }

    if (customElements.get('dataviz-tool-header')) {
      configureHeader()
    } else {
      customElements.whenDefined('dataviz-tool-header').then(configureHeader)
    }
  }, [t, charts, importProject, exportProject, getThumbnailDataUri, currentProjectId, currentProjectName, currentChart])

  //setting initial chart and related options
  useEffect(() => {
    setCurrentChart(charts[0])
    const options = getOptionsConfig(charts[0]?.visualOptions)
    setVisualOptions(getDefaultOptionsValues(options))
  }, [])

  return (
    <div className="App">

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".rawgraphs,.json"
        onChange={handleFileLoad}
      />
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
