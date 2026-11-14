import { useEffect } from 'react'

// Removes the parameters that have been handled from the address.
// `auth_debug` is kept: the shared auth client reads it to skip the redirect
// of unauthenticated users on local and preview builds, so removing it would
// send them away right after the data or the project is loaded.
function clearQueryString() {
  const params = new URLSearchParams(window.location.search)
  const query = params.has('auth_debug') ? '?auth_debug' : ''
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + query
  )
}

function getToolHeader() {
  return document.querySelector('dataviz-tool-header')
}

export default function useInitialUrlLoad({
  t,
  loadSampleRef,
  resolveCompatibleToolsForDataUrl,
  applyRecommendedRawgraphsChart,
  importSerializedProject,
  installHeaderProcessingToasts,
  showProcessingToast,
  showHeaderMessage,
  setCurrentProjectId,
}) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const dataUrl = params.get('data_url')
    if (dataUrl) {
      showProcessingToast(t('app.processingSample'))
      fetch(dataUrl)
        .then((res) => res.text())
        .then((text) => {
          const isTsv = dataUrl.endsWith('.tsv')
          if (loadSampleRef.current) {
            loadSampleRef.current(text, isTsv ? '\t' : ',')
          }
        })
        .then(() => resolveCompatibleToolsForDataUrl(dataUrl))
        .then((compatibleTools) => {
          applyRecommendedRawgraphsChart(compatibleTools)
        })
        .catch((err) => console.error('data_url load failed:', err))
      clearQueryString()
      return
    }

    const projectId = params.get('projectId')
    if (!projectId) return

    let isActive = true

    const doLoad = async () => {
      try {
        await customElements.whenDefined('dataviz-tool-header')
        if (!isActive) return

        const header = getToolHeader()
        installHeaderProcessingToasts(header)
        const projectData = await header.loadProject(projectId)
        if (!isActive) return

        importSerializedProject(projectData)
        setCurrentProjectId(projectId)
        clearQueryString()
      } catch (err) {
        console.error('Project Load Error:', err)
        showHeaderMessage(t('app.projectLoadError'), 'error')
      }
    }

    doLoad()

    return () => {
      isActive = false
    }
  }, [
    applyRecommendedRawgraphsChart,
    importSerializedProject,
    installHeaderProcessingToasts,
    loadSampleRef,
    resolveCompatibleToolsForDataUrl,
    setCurrentProjectId,
    showHeaderMessage,
    showProcessingToast,
    t,
  ])
}
