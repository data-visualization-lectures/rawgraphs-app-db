import {
  normalizeDatavizLocale,
  resolveDatavizLocale,
  resolveRawgraphsParsingLocale,
} from './datavizLocale'

describe('dataviz locale utilities', () => {
  test('normalizes supported locale values', () => {
    expect(normalizeDatavizLocale('ja-JP')).toBe('ja')
    expect(normalizeDatavizLocale('en-US')).toBe('en')
    expect(normalizeDatavizLocale('fr-FR')).toBeNull()
  })

  test('resolves lang query before cookie, html, and browser language', () => {
    expect(
      resolveDatavizLocale({
        location: { href: 'https://rawgraphs.dataviz.jp/?lang=ja' },
        documentRef: {
          cookie: 'locale=en',
          documentElement: { lang: 'en' },
        },
        navigatorRef: { language: 'en-US' },
      })
    ).toBe('ja')
  })

  test('resolves /en path before cookie and browser language', () => {
    expect(
      resolveDatavizLocale({
        location: { href: 'https://rawgraphs.dataviz.jp/en/' },
        documentRef: {
          cookie: 'locale=ja',
          documentElement: { lang: 'ja' },
        },
        navigatorRef: { language: 'ja-JP' },
      })
    ).toBe('en')
  })

  test('resolves locale cookie before html and browser language', () => {
    expect(
      resolveDatavizLocale({
        location: { href: 'https://rawgraphs.dataviz.jp/' },
        documentRef: {
          cookie: 'other=1; locale=ja',
          documentElement: { lang: 'en' },
        },
        navigatorRef: { language: 'en-US' },
      })
    ).toBe('ja')
  })

  test('falls back to Japanese when no locale signal is available', () => {
    expect(
      resolveDatavizLocale({
        location: { href: 'https://rawgraphs.dataviz.jp/' },
        documentRef: {
          cookie: '',
          documentElement: { lang: '' },
        },
        navigatorRef: { language: 'fr-FR' },
      })
    ).toBe('ja')
  })

  test('maps app locale to RAWGraphs parsing locale', () => {
    expect(
      resolveRawgraphsParsingLocale({
        location: { href: 'https://rawgraphs.dataviz.jp/?lang=ja' },
      })
    ).toBe('ja-JP')
    expect(
      resolveRawgraphsParsingLocale({
        location: { href: 'https://rawgraphs.dataviz.jp/?lang=en' },
      })
    ).toBe('en-US')
  })
})
