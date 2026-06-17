import { useCallback, useRef } from 'react'
import {
  getCompatibleToolsForDataUrl,
  getRawgraphsCatalogUrl,
} from '../utils/rawgraphsCatalog'

export default function useRawgraphsCatalog() {
  const catalogEntriesRef = useRef(null)

  const getCatalogEntries = useCallback(async () => {
    if (catalogEntriesRef.current) return catalogEntriesRef.current

    const res = await fetch(getRawgraphsCatalogUrl())
    if (!res.ok) throw new Error(`catalog fetch failed: ${res.status}`)

    const catalog = await res.json()
    catalogEntriesRef.current = catalog.entries || []
    return catalogEntriesRef.current
  }, [])

  const resolveCompatibleToolsForDataUrl = useCallback(
    async (dataUrl) => {
      const entries = await getCatalogEntries()
      return getCompatibleToolsForDataUrl(entries, dataUrl)
    },
    [getCatalogEntries]
  )

  return {
    getCatalogEntries,
    resolveCompatibleToolsForDataUrl,
  }
}
