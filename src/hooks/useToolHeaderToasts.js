import { useCallback, useRef } from 'react'

function getToolHeader() {
  return document.querySelector('dataviz-tool-header')
}

export default function useToolHeaderToasts(t) {
  const processingMessagesRef = useRef({})
  processingMessagesRef.current = {
    projectList: t('app.processingProjectList'),
    projectLoad: t('app.processingProjectLoad'),
    projectSave: t('app.processingProjectSave'),
  }

  const showHeaderMessage = useCallback((message, type = 'info', duration) => {
    const header = getToolHeader()
    if (header && typeof header.showMessage === 'function') {
      header.showMessage(message, type, duration)
    }
  }, [])

  const showProcessingToast = useCallback(
    (message) => {
      showHeaderMessage(message, 'info', 5000)
    },
    [showHeaderMessage]
  )

  const installHeaderProcessingToasts = useCallback(
    (header) => {
      if (!header || header.__dvzProcessingToastsInstalled === '1') return

      if (typeof header.showLoadModal === 'function') {
        const originalShowLoadModal = header.showLoadModal.bind(header)
        header.showLoadModal = (...args) => {
          showProcessingToast(processingMessagesRef.current.projectList)
          return originalShowLoadModal(...args)
        }
      }

      if (typeof header.loadProject === 'function') {
        const originalLoadProject = header.loadProject.bind(header)
        header.loadProject = (...args) => {
          showProcessingToast(processingMessagesRef.current.projectLoad)
          return originalLoadProject(...args)
        }
      }

      if (typeof header.saveProject === 'function') {
        const originalSaveProject = header.saveProject.bind(header)
        header.saveProject = (...args) => {
          showProcessingToast(processingMessagesRef.current.projectSave)
          return originalSaveProject(...args)
        }
      }

      header.__dvzProcessingToastsInstalled = '1'
    },
    [showProcessingToast]
  )

  return {
    showHeaderMessage,
    showProcessingToast,
    installHeaderProcessingToasts,
  }
}
