import { pickInterpolator } from './pickInterpolator'

const ten = Array.from({ length: 10 }, (_, i) => `#00000${i}`)
const presets = {
  schemeCategory10: { value: ten },
  interpolateTurbo: { value: () => '#000000' },
  interpolateSpectral: { value: () => '#000000' },
}

describe('pickInterpolator', () => {
  test('keeps the first scheme when it has enough colors', () => {
    expect(pickInterpolator(presets, 3, 'interpolateSpectral')).toBe(
      'schemeCategory10'
    )
    expect(pickInterpolator(presets, 10, 'interpolateSpectral')).toBe(
      'schemeCategory10'
    )
  })

  test('uses the scheme preferred by the chart when values exceed the colors', () => {
    expect(pickInterpolator(presets, 11, 'interpolateSpectral')).toBe(
      'interpolateSpectral'
    )
  })

  test('falls back to the first scheme without a fixed number of colors', () => {
    expect(pickInterpolator(presets, 12, undefined)).toBe('interpolateTurbo')
    expect(pickInterpolator(presets, 12, 'notAScheme')).toBe('interpolateTurbo')
    expect(pickInterpolator(presets, 12, 'schemeCategory10')).toBe(
      'interpolateTurbo'
    )
  })

  test('keeps the first scheme when it is not a fixed list of colors', () => {
    const sequential = {
      interpolateBlues: { value: () => '#000000' },
      interpolateReds: { value: () => '#000000' },
    }
    expect(pickInterpolator(sequential, 500, 'interpolateReds')).toBe(
      'interpolateBlues'
    )
  })

  test('keeps the first scheme when no scheme can cover the values', () => {
    const fixedOnly = { a: { value: ten }, b: { value: ten } }
    expect(pickInterpolator(fixedOnly, 12, 'b')).toBe('a')
  })

  test('returns undefined when there are no schemes', () => {
    expect(pickInterpolator(undefined, 5, 'x')).toBeUndefined()
    expect(pickInterpolator({}, 5, 'x')).toBeUndefined()
  })
})
