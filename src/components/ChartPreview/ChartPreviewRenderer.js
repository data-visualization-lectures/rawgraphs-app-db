import { chart as rawChart } from '@rawgraphs/rawgraphs-core'

const ERROR_MESSAGE_MAP = [
  {
    pattern:
      /Paddings are too high, decrase them in the "chart" options panel/i,
    key: 'chartPreview.error.paddingsTooHigh',
  },
  {
    pattern: /Selected project is not valid/i,
    key: 'chartPreview.error.invalidProject',
  },
  {
    pattern: /Invalid version number, please use a suitable deserializer/i,
    key: 'chartPreview.error.invalidVersion',
  },
  {
    pattern: /Unknown chart!/i,
    key: 'chartPreview.error.unknownChart',
  },
  {
    pattern: /No serializer found for version (.+)/i,
    key: 'chartPreview.error.noSerializer',
    params: (m) => ({ version: m[1] }),
  },
  {
    pattern: /Can't open your project\. Invalid file/i,
    key: 'chartPreview.error.cantOpenInvalid',
  },
  {
    pattern: /Can't open your project\. (.+)/i,
    key: 'chartPreview.error.cantOpen',
    params: (m) => ({ detail: m[1] }),
  },
]

function translateErrorMessage(msg, t) {
  const message = msg ? String(msg) : ''
  for (const { pattern, key, params } of ERROR_MESSAGE_MAP) {
    const m = message.match(pattern)
    if (m) return t(key, params ? params(m) : {})
  }
  return message
}

export function getChartRenderError(error, t) {
  return {
    variant: 'danger',
    message:
      t('chartPreview.chartError') + translateErrorMessage(error?.message, t),
  }
}

export function renderRawChartToDOM({
  chart,
  data,
  dataTypes,
  domNode,
  mappedData,
  mapping,
  visualOptions,
}) {
  const viz = rawChart(chart, {
    data,
    mapping,
    dataTypes,
    visualOptions,
  })

  return viz.renderToDOM(domNode, mappedData)
}
