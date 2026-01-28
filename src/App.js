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
import charts from './charts'
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

// #TODO: i18n

import { loadProject } from './utils/cloudApi'
import LoadCloudProject from './components/DataLoader/loaders/LoadCloudProject'
import { Modal, Tab, Tabs } from 'react-bootstrap'

// import FixedHeader from './components/FixedHeader/FixedHeader'

function App() {
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


  // Handle project loading from URL query param (integration with auth.dataviz.jp)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const projectId = params.get('project_id')

    if (projectId) {
      console.log('Found project_id in URL:', projectId)

      loadProject(projectId)
        .then((projectData) => {
          console.log('Project data loaded:', projectData)
          // We need to deserialize the project to link the chart string to the actual chart object
          // deserializeProject expects a string, so we stringify the object first
          const project = deserializeProject(
            JSON.stringify(projectData),
            charts
          )
          importProject(project)

          // Remove query param from URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          )
        })
        .catch((err) => {
          console.error('Project Load Error:', err)
          alert(
            'プロジェクトの読み込みに失敗しました。ログイン状態を確認してください。'
          )
        })
    }
  }, [importProject])

  // Save Project to File Logic
  const saveProjectToFile = useCallback(() => {
    const project = exportProject()
    const str = JSON.stringify(project)
    const blob = new Blob([str], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'project.rawgraphs'
    a.click()
    URL.revokeObjectURL(url)
  }, [exportProject])

  // Load Project Modal State
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [loadingError, setLoadingError] = useState(null)

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
          header.showMessage('プロジェクトの読み込みに失敗しました。', 'error')
        } else {
          alert('プロジェクトの読み込みに失敗しました。')
        }
      }
    }
    reader.readAsText(file)
  }, [importProject])

  const loadProjectFromFile = useCallback(() => {
    setShowLoadModal(true)
  }, [])

  // Configure Tool Header
  useEffect(() => {
    const configureHeader = () => {
      const header = document.querySelector('dataviz-tool-header')
      if (header) {
        if (typeof header.setConfig === 'function') {
          header.setConfig({
            backgroundColor: '#06c26c',
            logo: {
              type: 'image',
              src: '/logo_rawgraphs.png',
              href: '/' // Or appropriate link
            },
            buttons: [
              {
                id: 'load-project-btn',
                label: 'プロジェクトの読込',
                action: loadProjectFromFile,
                align: 'right'
              },
              {
                id: 'save-project-btn',
                label: 'プロジェクトの保存',
                action: saveProjectToFile,
                align: 'right'
              }
            ]
          })
        }
      }
    }

    if (customElements.get('dataviz-tool-header')) {
      configureHeader()
    } else {
      customElements.whenDefined('dataviz-tool-header').then(configureHeader)
    }
  }, [loadProjectFromFile, saveProjectToFile])

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
      <div className="app-sections" style={{ marginTop: '48px' }}>
        <Section title={`1. データを読み込む`} loading={loading}>
          <DataLoader {...dataLoader} hydrateFromProject={importProject} />
        </Section>
        {data && (
          <Section title="2. チャートを選ぶ">
            <ChartSelector
              availableCharts={charts}
              currentChart={currentChart}
              setCurrentChart={handleChartChange}
            />
          </Section>
        )}
        {data && currentChart && (
          <Section title={`3. マッピングする`} loading={mappingLoading}>
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
          <Section title="4. カスタマイズする">
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
          <Section title="5. 書き出す">
            <Exporter rawViz={rawViz} exportProject={exportProject} />
          </Section>
        )}
        <Footer />
        <CookieConsent
          location="bottom"
          buttonText="了解しました"
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
          本サイトでは、Google Analyticsを使用して閲覧データを匿名で収集しています。{' '}
          <a
            href="https://rawgraphs.io/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-body border-bottom border-dark"
          >
            Learn More
          </a>
        </CookieConsent>
      </div>
      <ScreenSizeAlert />

      {/* Load Project Modal */}
      <Modal show={showLoadModal} onHide={() => setShowLoadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>プロジェクトを読み込む</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="file" id="load-project-tabs">
            <Tab eventKey="file" title="ファイルから">
              <div className="p-3">
                <p>ローカルに保存されたプロジェクト・ファイル（.rawgraphs）を選択してください。</p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click()
                      setShowLoadModal(false)
                    }
                  }}
                >
                  ファイルを選択
                </button>
              </div>
            </Tab>
            <Tab eventKey="cloud" title="サーバから">
              <LoadCloudProject
                onProjectSelected={(project) => {
                  importProject(project)
                  setShowLoadModal(false)
                }}
                setLoadingError={setLoadingError}
              />
            </Tab>
          </Tabs>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default App
