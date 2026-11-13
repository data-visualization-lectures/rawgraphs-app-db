// Chooses the color scheme used when a color scale is set up automatically.
//
// The first scheme of the scale type is used, as before. Some ordinal schemes
// have a fixed number of colors (e.g. 10): the core gives the default grey to
// the values that exceed it. When the values are more than the colors of the
// first scheme, a scheme without a fixed number of colors is chosen instead:
// the one preferred by the chart if it has no limit, otherwise the first one
// available.
export function pickInterpolator(presets, domainLength, preferred) {
  const names = presets ? Object.keys(presets) : []
  const first = names[0]
  if (!first) {
    return first
  }

  const hasEnoughColors = (name) => {
    const scheme = presets[name].value
    return !Array.isArray(scheme) || scheme.length >= domainLength
  }
  if (hasEnoughColors(first)) {
    return first
  }

  const isUnlimited = (name) => typeof presets[name].value === 'function'
  if (preferred && presets[preferred] && isUnlimited(preferred)) {
    return preferred
  }
  return names.find(isUnlimited) || first
}
