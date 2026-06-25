import React from 'react'
import { act, cleanup, render } from '@testing-library/react'
import useInitialUrlLoad from './useInitialUrlLoad'

const originalFetch = global.fetch
const originalCustomElements = window.customElements

function TestComponent(props) {
  useInitialUrlLoad(props)
  return null
}

function createProps(overrides = {}) {
  return {
    t: (key) => key,
    loadSampleRef: { current: jest.fn() },
    resolveCompatibleToolsForDataUrl: jest.fn(() => Promise.resolve([])),
    applyRecommendedRawgraphsChart: jest.fn(),
    importSerializedProject: jest.fn(),
    installHeaderProcessingToasts: jest.fn(),
    showProcessingToast: jest.fn(),
    showHeaderMessage: jest.fn(),
    setCurrentProjectId: jest.fn(),
    ...overrides,
  }
}

async function flushAsyncWork() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

function appendHeader(loadProject = jest.fn()) {
  const header = document.createElement('dataviz-tool-header')
  header.loadProject = loadProject
  document.body.appendChild(header)
  return header
}

beforeEach(() => {
  window.history.pushState({}, '', '/')
  Object.defineProperty(window, 'customElements', {
    configurable: true,
    value: {
      whenDefined: jest.fn(() => Promise.resolve()),
    },
  })
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  global.fetch = originalFetch
  Object.defineProperty(window, 'customElements', {
    configurable: true,
    value: originalCustomElements,
  })
  window.history.pushState({}, '', '/')
  jest.clearAllMocks()
})

test('loads a saved project from projectId query parameter', async () => {
  const projectData = { chart: 'rawgraphs.test' }
  const loadProject = jest.fn(() => Promise.resolve(projectData))
  appendHeader(loadProject)
  window.history.pushState({}, '', '/?projectId=project-123')
  const props = createProps()

  render(<TestComponent {...props} />)

  await act(async () => {
    await flushAsyncWork()
  })

  expect(window.customElements.whenDefined).toHaveBeenCalledWith(
    'dataviz-tool-header'
  )
  expect(props.installHeaderProcessingToasts).toHaveBeenCalled()
  expect(loadProject).toHaveBeenCalledWith('project-123')
  expect(props.importSerializedProject).toHaveBeenCalledWith(projectData)
  expect(props.setCurrentProjectId).toHaveBeenCalledWith('project-123')
  expect(window.location.search).toBe('')
})

test('does not load a saved project from legacy project_id query parameter', async () => {
  const loadProject = jest.fn(() => Promise.resolve({}))
  appendHeader(loadProject)
  window.history.pushState({}, '', '/?project_id=legacy-123')
  const props = createProps()

  render(<TestComponent {...props} />)

  await act(async () => {
    await flushAsyncWork()
  })

  expect(window.customElements.whenDefined).not.toHaveBeenCalled()
  expect(loadProject).not.toHaveBeenCalled()
  expect(props.importSerializedProject).not.toHaveBeenCalled()
  expect(window.location.search).toBe('?project_id=legacy-123')
})

test('keeps data_url loading behavior ahead of projectId loading', async () => {
  const dataUrl = 'https://example.com/data.tsv'
  const text = 'label\tvalue\nA\t1'
  const loadProject = jest.fn(() => Promise.resolve({}))
  const compatibleTools = ['rawgraphs/rawgraphs.barchart']
  appendHeader(loadProject)
  global.fetch = jest.fn(() =>
    Promise.resolve({
      text: () => Promise.resolve(text),
    })
  )
  window.history.pushState(
    {},
    '',
    `/?data_url=${encodeURIComponent(dataUrl)}&projectId=project-123`
  )
  const props = createProps({
    resolveCompatibleToolsForDataUrl: jest.fn(() =>
      Promise.resolve(compatibleTools)
    ),
  })

  render(<TestComponent {...props} />)

  await act(async () => {
    await flushAsyncWork()
  })

  expect(global.fetch).toHaveBeenCalledWith(dataUrl)
  expect(props.loadSampleRef.current).toHaveBeenCalledWith(text, '\t')
  expect(props.resolveCompatibleToolsForDataUrl).toHaveBeenCalledWith(dataUrl)
  expect(props.applyRecommendedRawgraphsChart).toHaveBeenCalledWith(
    compatibleTools
  )
  expect(loadProject).not.toHaveBeenCalled()
  expect(window.location.search).toBe('')
})
