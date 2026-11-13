import {
  dimensions,
  mapData,
  buildGroups,
  sortGroups,
  silvermanBandwidth,
  kernelDensity,
} from './mapping'

describe('Ridgeline mapData', () => {
  const dataTypes = {
    city: { type: 'string' },
    temp: { type: 'number' },
  }
  const groupedMapping = () => ({
    value: { value: 'temp' },
    group: { value: 'city' },
  })

  test('returns one { group, value } per row, without aggregating', () => {
    const data = [
      { city: 'A', temp: 1 },
      { city: 'A', temp: 1 },
      { city: 'B', temp: 3 },
    ]
    expect(mapData(data, groupedMapping(), dataTypes, dimensions)).toEqual([
      { group: 'A', value: 1 },
      { group: 'A', value: 1 },
      { group: 'B', value: 3 },
    ])
  })

  test('leaves out rows with an empty value', () => {
    const data = [
      { city: 'A', temp: 1 },
      { city: 'A', temp: null },
      { city: 'A', temp: undefined },
      { city: 'A', temp: '' },
      { city: 'A', temp: 0 },
    ]
    expect(mapData(data, groupedMapping(), dataTypes, dimensions)).toEqual([
      { group: 'A', value: 1 },
      { group: 'A', value: 0 },
    ])
  })

  test('leaves out rows with an empty group when a group is assigned', () => {
    const data = [
      { city: 'A', temp: 1 },
      { city: '', temp: 2 },
      { city: null, temp: 3 },
      { city: undefined, temp: 4 },
    ]
    expect(mapData(data, groupedMapping(), dataTypes, dimensions)).toEqual([
      { group: 'A', value: 1 },
    ])
  })

  test('keeps a group that is 0', () => {
    const data = [{ city: 0, temp: 1 }]
    expect(mapData(data, groupedMapping(), dataTypes, dimensions)).toEqual([
      { group: 0, value: 1 },
    ])
  })

  test('without a group, every row gets the same group and none is dropped', () => {
    const data = [{ city: 'A', temp: 1 }, { city: '', temp: 2 }, { temp: 3 }]
    const mapping = { value: { value: 'temp' } }
    expect(mapData(data, mapping, dataTypes, dimensions)).toEqual([
      { group: undefined, value: 1 },
      { group: undefined, value: 2 },
      { group: undefined, value: 3 },
    ])
    expect(mapping.group).toEqual({ value: undefined })
  })

  test('keeps Date groups as they are', () => {
    const day = new Date(2020, 0, 1)
    const result = mapData(
      [{ city: day, temp: 1 }],
      groupedMapping(),
      dataTypes,
      dimensions
    )
    expect(result[0].group).toBe(day)
  })

  test('declares value (required, number) and group (optional), both with operation get', () => {
    expect(dimensions.map((d) => d.id)).toEqual(['value', 'group'])
    const [value, group] = dimensions
    expect(value.required).toBe(true)
    expect(value.validTypes).toEqual(['number'])
    expect(group.required).toBe(false)
    expect(group.validTypes).toEqual(['number', 'date', 'string'])
    expect(dimensions.every((d) => d.operation === 'get')).toBe(true)
    expect(dimensions.some((d) => d.aggregation)).toBe(false)
  })
})

describe('buildGroups', () => {
  test('groups the values in order of first appearance', () => {
    const rows = [
      { group: 'b', value: 1 },
      { group: 'a', value: 2 },
      { group: 'b', value: 3 },
    ]
    expect(buildGroups(rows)).toEqual([
      { group: 'b', values: [1, 3] },
      { group: 'a', values: [2] },
    ])
  })

  test('groups Date objects by value, not by identity', () => {
    const rows = [
      { group: new Date(2020, 0, 1), value: 1 },
      { group: new Date(2020, 0, 1), value: 2 },
      { group: new Date(2020, 0, 2), value: 3 },
    ]
    const groups = buildGroups(rows)
    expect(groups).toHaveLength(2)
    expect(groups[0].values).toEqual([1, 2])
  })

  test('throws when a value is not a finite number', () => {
    expect(() => buildGroups([{ group: '', value: 'abc' }])).toThrow(
      /only numbers.*"abc"/
    )
    expect(() => buildGroups([{ group: '', value: NaN }])).toThrow(
      /only numbers/
    )
    expect(() => buildGroups([{ group: '', value: Infinity }])).toThrow(
      /only numbers/
    )
    expect(() => buildGroups([{ group: '', value: '12' }])).toThrow(
      /only numbers/
    )
  })
})

describe('sortGroups', () => {
  const groups = [
    { group: 'b', values: [5, 7, 9] },
    { group: 'c', values: [1, 2, 3] },
    { group: 'a', values: [20, 30] },
  ]
  const names = (list) => list.map((g) => g.group)

  test('original keeps the order', () => {
    expect(names(sortGroups(groups, 'original'))).toEqual(['b', 'c', 'a'])
  })

  test('name sorts by group, also for numbers and dates', () => {
    expect(names(sortGroups(groups, 'name'))).toEqual(['a', 'b', 'c'])
    const numbers = [
      { group: 10, values: [1] },
      { group: 2, values: [1] },
    ]
    expect(names(sortGroups(numbers, 'name'))).toEqual([2, 10])
    const early = new Date(2020, 0, 1)
    const late = new Date(2021, 0, 1)
    const dates = [
      { group: late, values: [1] },
      { group: early, values: [1] },
    ]
    expect(names(sortGroups(dates, 'name'))).toEqual([early, late])
  })

  test('name sorts digits in text as numbers, not as characters', () => {
    const month = (list) =>
      names(
        sortGroups(
          list.map((group) => ({ group, values: [1] })),
          'name'
        )
      )
    expect(month(['10月', '2月', '1月'])).toEqual(['1月', '2月', '10月'])
    expect(month(['12月', '1月', '11月', '10月', '2月'])).toEqual([
      '1月',
      '2月',
      '10月',
      '11月',
      '12月',
    ])
    // numbers are compared as numbers
    expect(month([100, 9, 10])).toEqual([9, 10, 100])
    // the same numbers given as text
    expect(month(['100', '9', '10'])).toEqual(['9', '10', '100'])
    // numbers and text together are compared as text
    expect(month([10, 'b', 9, 'a'])).toEqual([9, 10, 'a', 'b'])
  })

  test('name sorts dates by time', () => {
    const jan = new Date(2020, 0, 15)
    const feb = new Date(2020, 1, 1)
    const dec = new Date(2019, 11, 31)
    const sorted = sortGroups(
      [jan, feb, dec].map((group) => ({ group, values: [1] })),
      'name'
    )
    expect(names(sorted)).toEqual([dec, jan, feb])
  })

  test('median sorts by the median of the values', () => {
    // medians: b 7, c 2, a 25
    expect(names(sortGroups(groups, 'medianAscending'))).toEqual([
      'c',
      'b',
      'a',
    ])
    expect(names(sortGroups(groups, 'medianDescending'))).toEqual([
      'a',
      'b',
      'c',
    ])
  })

  test('does not modify its input, and keeps the original order for ties', () => {
    const tied = [
      { group: 'x', values: [1] },
      { group: 'y', values: [1] },
    ]
    expect(names(sortGroups(tied, 'medianDescending'))).toEqual(['x', 'y'])
    sortGroups(groups, 'name')
    expect(names(groups)).toEqual(['b', 'c', 'a'])
  })

  test('throws on an unknown order', () => {
    expect(() => sortGroups(groups, 'size')).toThrow(/Unknown sort order/)
  })
})

describe('silvermanBandwidth', () => {
  test('follows 0.9 * min(sd, IQR / 1.34) * n^(-1/5)', () => {
    // values 1..5: sd = sqrt(2.5), quartiles 2 and 4, so IQR / 1.34 is the smaller
    const expected = 0.9 * (2 / 1.34) * Math.pow(5, -0.2)
    expect(silvermanBandwidth([1, 2, 3, 4, 5])).toBeCloseTo(expected, 10)
  })

  test('uses the standard deviation when it is smaller than IQR / 1.34', () => {
    // two clusters: the IQR is wide, the sd is the smaller of the two
    const values = [0, 0, 0, 0, 10, 10, 10, 10]
    const mean = 5
    const sd = Math.sqrt(
      values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)
    )
    expect(10 / 1.34).toBeGreaterThan(sd)
    expect(silvermanBandwidth(values)).toBeCloseTo(
      0.9 * sd * Math.pow(values.length, -0.2),
      10
    )
  })

  test('is independent of the order of the values and does not modify them', () => {
    const values = [5, 1, 4, 2, 3]
    const copy = values.slice()
    expect(silvermanBandwidth(values)).toBeCloseTo(
      silvermanBandwidth([1, 2, 3, 4, 5]),
      10
    )
    expect(values).toEqual(copy)
  })

  test('scales with the values', () => {
    const a = silvermanBandwidth([1, 2, 3, 4, 5, 9])
    const b = silvermanBandwidth([10, 20, 30, 40, 50, 90])
    expect(b / a).toBeCloseTo(10, 10)
  })

  test('is 0 when the values have no spread: one value, equal values, no values', () => {
    expect(silvermanBandwidth([7])).toBe(0)
    expect(silvermanBandwidth([-7])).toBe(0)
    expect(silvermanBandwidth([4, 4, 4, 4])).toBe(0)
    // the size of the values does not matter
    expect(silvermanBandwidth([1000, 1000, 1000])).toBe(0)
    expect(silvermanBandwidth([0])).toBe(0)
    expect(silvermanBandwidth([0, 0, 0])).toBe(0)
    expect(silvermanBandwidth([])).toBe(0)
  })

  test('is positive when the values vary', () => {
    expect(silvermanBandwidth([1, 2])).toBeGreaterThan(0)
    expect(silvermanBandwidth([0, 0, 0, 0, 1])).toBeGreaterThan(0)
  })

  test('falls back to the standard deviation when the IQR is 0', () => {
    const values = [5, 5, 5, 5, 5, 5, 5, 5, 5, 25]
    const mean = 7
    const sd = Math.sqrt(
      values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)
    )
    expect(silvermanBandwidth(values)).toBeCloseTo(
      0.9 * sd * Math.pow(values.length, -0.2),
      10
    )
  })
})

describe('kernelDensity', () => {
  const gauss = (u) => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI)

  test('a single value gives a Gaussian centered on it', () => {
    const [atCenter, atOne, atMinusOne] = kernelDensity([0], [0, 1, -1], 1)
    expect(atCenter).toBeCloseTo(gauss(0), 12)
    expect(atOne).toBeCloseTo(gauss(1), 12)
    expect(atMinusOne).toBeCloseTo(atOne, 12)
  })

  test('the bandwidth is the standard deviation of the kernel', () => {
    const [d] = kernelDensity([10], [10], 2)
    expect(d).toBeCloseTo(gauss(0) / 2, 12)
    const [e] = kernelDensity([10], [12], 2)
    expect(e).toBeCloseTo(gauss(1) / 2, 12)
  })

  test('averages the kernels of all the values', () => {
    const [d] = kernelDensity([0, 2], [1], 1)
    expect(d).toBeCloseTo(gauss(1), 12)
    const [e] = kernelDensity([0, 2], [0], 1)
    expect(e).toBeCloseTo((gauss(0) + gauss(2)) / 2, 12)
  })

  test('integrates to 1', () => {
    const values = [1, 2, 2.5, 7]
    const xs = Array.from({ length: 2001 }, (_, i) => -20 + i * 0.02)
    const density = kernelDensity(values, xs, 1.3)
    let area = 0
    for (let i = 1; i < xs.length; i++) {
      area += ((density[i] + density[i - 1]) / 2) * (xs[i] - xs[i - 1])
    }
    expect(area).toBeCloseTo(1, 6)
  })

  test('gives 0 everywhere for no values', () => {
    expect(kernelDensity([], [0, 1], 1)).toEqual([0, 0])
  })

  test('throws when the bandwidth is not a positive number', () => {
    expect(() => kernelDensity([1], [1], 0)).toThrow(/bandwidth/)
    expect(() => kernelDensity([1], [1], -1)).toThrow(/bandwidth/)
    expect(() => kernelDensity([1], [1], NaN)).toThrow(/bandwidth/)
    expect(() => kernelDensity([1], [1], Infinity)).toThrow(/bandwidth/)
  })
})
