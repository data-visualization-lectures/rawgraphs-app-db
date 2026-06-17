import {
  DEFAULT_DATAVIZ_AUTH_URL,
  findCatalogEntryForDataUrl,
  findRecommendedRawgraphsChartId,
  getCompatibleToolsForDataUrl,
  getRawgraphsCatalogUrl,
  parseCompatibleToolToken,
} from './rawgraphsCatalog'

describe('rawgraphs catalog utilities', () => {
  test('builds catalog URL from configured or default base URL', () => {
    expect(getRawgraphsCatalogUrl('https://example.com')).toBe(
      'https://example.com/catalog.json'
    )
    expect(getRawgraphsCatalogUrl()).toBe(
      `${DEFAULT_DATAVIZ_AUTH_URL}/catalog.json`
    )
  })

  test('parses compatible tool tokens', () => {
    expect(parseCompatibleToolToken('rawgraphs/rawgraphs.barchart')).toEqual({
      baseTool: 'rawgraphs',
      chartKey: 'rawgraphs.barchart',
    })
    expect(parseCompatibleToolToken('rawgraphs')).toEqual({
      baseTool: 'rawgraphs',
      chartKey: null,
    })
  })

  test('finds the first rawgraphs chart recommendation', () => {
    expect(
      findRecommendedRawgraphsChartId([
        'table-cleaner',
        'rawgraphs/rawgraphs.linechart',
      ])
    ).toBe('rawgraphs.linechart')
    expect(findRecommendedRawgraphsChartId(['rawgraphs'])).toBeNull()
  })

  test('finds catalog entries by primary and variant URLs', () => {
    const entries = [
      {
        fileUrl: 'https://example.com/a.csv',
        compatibleTools: ['rawgraphs/rawgraphs.barchart'],
      },
      {
        fileUrl: 'https://example.com/b.csv',
        variants: [{ fileUrlEn: 'https://example.com/b-en.csv' }],
        compatibleTools: ['rawgraphs/rawgraphs.linechart'],
      },
    ]

    expect(
      findCatalogEntryForDataUrl(entries, 'https://example.com/a.csv')
    ).toBe(entries[0])
    expect(
      findCatalogEntryForDataUrl(entries, 'https://example.com/b-en.csv')
    ).toBe(entries[1])
    expect(
      getCompatibleToolsForDataUrl(entries, 'https://example.com/b-en.csv')
    ).toEqual(['rawgraphs/rawgraphs.linechart'])
  })
})
