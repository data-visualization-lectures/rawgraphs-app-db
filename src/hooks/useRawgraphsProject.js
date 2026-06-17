import { useCallback, useState } from 'react'
import { serializeProject, deserializeProject } from '@rawgraphs/rawgraphs-core'
import isPlainObject from 'lodash/isPlainObject'

function serializeProjectData(projectData) {
  return typeof projectData === 'string'
    ? projectData
    : JSON.stringify(projectData)
}

export default function useRawgraphsProject({
  charts,
  dataLoader,
  currentChart,
  setCurrentChart,
  mapping,
  setMapping,
  visualOptions,
  setVisualOptions,
  rawViz,
}) {
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
    hydrateFromSavedProject,
  } = dataLoader

  const [currentProjectId, setCurrentProjectId] = useState(null)
  const [currentProjectName, setCurrentProjectName] = useState(null)

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

  const importProject = useCallback(
    (project) => {
      hydrateFromSavedProject(project)
      setCurrentChart(project.currentChart)
      setMapping(project.mapping)

      const patchedOptions = Object.keys(project.visualOptions || {}).reduce(
        (options, optionKey) => {
          const optionValue = project.visualOptions[optionKey]
          return {
            ...options,
            [optionKey]: isPlainObject(optionValue)
              ? { ...optionValue, __loaded: true }
              : optionValue,
          }
        },
        {}
      )
      setVisualOptions(patchedOptions)
    },
    [hydrateFromSavedProject, setCurrentChart, setMapping, setVisualOptions]
  )

  const importSerializedProject = useCallback(
    (projectData) => {
      const project = deserializeProject(
        serializeProjectData(projectData),
        charts
      )
      importProject(project)
      return project
    },
    [charts, importProject]
  )

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

  return {
    currentProjectId,
    currentProjectName,
    setCurrentProjectId,
    setCurrentProjectName,
    exportProject,
    importProject,
    importSerializedProject,
    getThumbnailDataUri,
  }
}
