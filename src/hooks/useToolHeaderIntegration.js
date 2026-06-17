import { useEffect, useRef } from 'react'
import { RAWGRAPHS_TOOL_ID } from '../utils/rawgraphsCatalog'

export default function useToolHeaderIntegration({
  t,
  currentProjectId,
  currentProjectName,
  exportProject,
  getThumbnailDataUri,
  importSerializedProject,
  loadSample,
  applyRecommendedRawgraphsChart,
  installHeaderProcessingToasts,
  showProcessingToast,
  setCurrentProjectId,
  setCurrentProjectName,
}) {
  const loadSampleRef = useRef(loadSample)

  useEffect(() => {
    loadSampleRef.current = loadSample
  }, [loadSample])

  useEffect(() => {
    const configureHeader = () => {
      const header = document.querySelector('dataviz-tool-header')
      if (!header) return
      installHeaderProcessingToasts(header)

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
                showProcessingToast(t('app.processingSavePrep'))
                const projectData = exportProject()
                const thumbnailDataUri = await getThumbnailDataUri()
                header.showSaveModal({
                  name: currentProjectName || undefined,
                  data: projectData,
                  thumbnailDataUri,
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
          onProjectLoad: (projectData, meta) => {
            importSerializedProject(projectData)
            if (meta && !meta.isGroupProject && meta.projectId) {
              setCurrentProjectId(meta.projectId)
            }
            if (meta?.projectName) {
              setCurrentProjectName(meta.projectName)
            }
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

      if (typeof header.setSampleConfig === 'function') {
        header.setSampleConfig({
          toolId: RAWGRAPHS_TOOL_ID,
          onSampleSelect: (detail) => {
            showProcessingToast(t('app.processingSample'))
            applyRecommendedRawgraphsChart(detail.compatibleTools || [])
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
  }, [
    t,
    importSerializedProject,
    exportProject,
    getThumbnailDataUri,
    currentProjectId,
    currentProjectName,
    applyRecommendedRawgraphsChart,
    installHeaderProcessingToasts,
    showProcessingToast,
    setCurrentProjectId,
    setCurrentProjectName,
  ])

  return loadSampleRef
}
