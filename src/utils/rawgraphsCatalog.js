export const RAWGRAPHS_TOOL_ID = 'rawgraphs'
export const DEFAULT_DATAVIZ_AUTH_URL = 'https://app.dataviz.jp'

export function getRawgraphsCatalogUrl(baseUrl) {
  const resolvedBaseUrl =
    baseUrl ||
    (typeof window !== 'undefined' ? window.datavizAuthUrl : undefined) ||
    DEFAULT_DATAVIZ_AUTH_URL

  return `${resolvedBaseUrl}/catalog.json`
}

export function parseCompatibleToolToken(token) {
  const value = String(token || '').trim()
  const slashIndex = value.indexOf('/')
  if (slashIndex === -1) {
    return {
      baseTool: value,
      chartKey: null,
    }
  }

  return {
    baseTool: value.slice(0, slashIndex),
    chartKey: value.slice(slashIndex + 1) || null,
  }
}

export function findRecommendedRawgraphsChartId(compatibleTools) {
  const match = (compatibleTools || [])
    .map(parseCompatibleToolToken)
    .find((token) => token.baseTool === RAWGRAPHS_TOOL_ID && token.chartKey)
  return match?.chartKey || null
}

export function findCatalogEntryForDataUrl(entries, dataUrl) {
  return (entries || []).find((item) => {
    const urlMatch = item.fileUrl === dataUrl || item.fileUrlEn === dataUrl
    if (urlMatch) return true

    return (item.variants || []).some(
      (variant) => variant.fileUrl === dataUrl || variant.fileUrlEn === dataUrl
    )
  })
}

export function getCompatibleToolsForDataUrl(entries, dataUrl) {
  return findCatalogEntryForDataUrl(entries, dataUrl)?.compatibleTools || []
}
