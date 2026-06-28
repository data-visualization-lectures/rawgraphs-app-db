const SUPPORTED_APP_LOCALES = ['ja', 'en']

export function normalizeDatavizLocale(value) {
  const lang = String(value || '').trim().toLowerCase()
  if (lang === 'ja' || lang.startsWith('ja-')) return 'ja'
  if (lang === 'en' || lang.startsWith('en-')) return 'en'
  return null
}

export function resolveDatavizLocale({
  location = typeof window !== 'undefined' ? window.location : null,
  documentRef = typeof document !== 'undefined' ? document : null,
  navigatorRef = typeof navigator !== 'undefined' ? navigator : null,
} = {}) {
  const sharedLocale =
    typeof window !== 'undefined' && window.DatavizLocale?.resolve
      ? normalizeDatavizLocale(window.DatavizLocale.resolve())
      : null
  if (sharedLocale) return sharedLocale

  try {
    const href = location?.href || String(location || '')
    const url = new URL(href)
    const langParam = normalizeDatavizLocale(url.searchParams.get('lang'))
    if (langParam) return langParam
    if (url.pathname === '/en' || url.pathname.startsWith('/en/')) return 'en'
  } catch (_error) {
    // ignore
  }

  try {
    const raw = String(documentRef?.cookie || '')
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('locale='))
    const cookieLocale = raw
      ? normalizeDatavizLocale(decodeURIComponent(raw.slice('locale='.length)))
      : null
    if (cookieLocale) return cookieLocale
  } catch (_error) {
    // ignore
  }

  const htmlLocale = normalizeDatavizLocale(documentRef?.documentElement?.lang)
  if (htmlLocale) return htmlLocale

  return (
    normalizeDatavizLocale(navigatorRef?.language || navigatorRef?.userLanguage) ||
    'ja'
  )
}

export function resolveRawgraphsParsingLocale(options = {}) {
  const appLocale = resolveDatavizLocale(options)
  return appLocale === 'ja' ? 'ja-JP' : 'en-US'
}

export function isSupportedAppLocale(value) {
  return SUPPORTED_APP_LOCALES.includes(value)
}
