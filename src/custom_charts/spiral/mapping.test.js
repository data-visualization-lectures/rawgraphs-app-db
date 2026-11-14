import { mapData } from './mapping'

describe('Spiral Chart data mapping', () => {
  const data = [
    { date: '2020-01-01', value: 10, city: 'Tokyo' },
    { date: '2020-02-01', value: 15, city: 'Tokyo' },
    { date: '2020-01-01', value: 20, city: 'New York' },
    { date: '2020-02-01', value: 25, city: 'New York' },
  ]

  const dimensions = [{ id: 'date' }, { id: 'value' }, { id: 'series' }]

  test('should handle Series mapping correctly', () => {
    const mapping = {
      date: { value: 'date' },
      value: { value: 'value' },
      series: { value: 'city' }, // Mapped to 'city'
    }

    const result = mapData(data, mapping, {}, dimensions)

    // We expect 4 items (flat list), but with 'series' property set correctly
    expect(result).toHaveLength(4)

    const tokyoItems = result.filter((d) => d.series === 'Tokyo')
    const nyItems = result.filter((d) => d.series === 'New York')

    expect(tokyoItems).toHaveLength(2)
    expect(nyItems).toHaveLength(2)

    expect(tokyoItems[0].values.value).toBe(10)
    expect(nyItems[0].values.value).toBe(20)
  })

  test('should handle Unmapped Series correctly', () => {
    const mapping = {
      date: { value: 'date' },
      value: { value: 'value' },
      series: { value: undefined }, // Not mapped
    }

    const result = mapData(data, mapping, {}, dimensions)

    expect(result).toHaveLength(2)
    // Series should be undefined
    expect(result[0].series).toBeUndefined()
    // Dates should be distinct (one for each date in input)
    expect(result[0].date).toBe('2020-01-01')
    expect(result[1].date).toBe('2020-02-01')
  })
})

describe('Spiral Chart: years given as numbers', () => {
  const { toDate, dimensions: spiralDimensions } = require('./mapping')

  test('the date dimension accepts dates and numbers', () => {
    const date = spiralDimensions.find((d) => d.id === 'date')
    expect(date.validTypes).toEqual(['date', 'number'])
  })

  test('a whole number becomes January 1st of that year', () => {
    const date = toDate(1898)
    expect(date).toBeInstanceOf(Date)
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([
      1898, 0, 1,
    ])
    expect([date.getHours(), date.getMinutes(), date.getSeconds()]).toEqual([
      0, 0, 0,
    ])
  })

  test('years below 100 are not shifted to the 1900s', () => {
    expect(toDate(50).getFullYear()).toBe(50)
  })

  test('gives the same date as the "YYYY" date format', () => {
    const d3 = require('d3')
    const parsed = d3.timeParse('%Y')('1898')
    expect(toDate(1898).getTime()).toBe(parsed.getTime())
  })

  test('other values are left unchanged', () => {
    const date = new Date(2020, 5, 1)
    expect(toDate(date)).toBe(date)
    expect(toDate('2020-01-01')).toBe('2020-01-01')
    expect(toDate(2020.5)).toBe(2020.5)
    expect(toDate(null)).toBe(null)
  })

  test('mapData converts a column of years', () => {
    const rows = [
      { year: 1898, anomaly: -1.03 },
      { year: 1899, anomaly: -1.11 },
    ]
    const mapping = {
      date: { value: 'year' },
      value: { value: ['anomaly'] },
      series: { value: undefined },
    }
    const result = mapData(rows, mapping, {}, spiralDimensions)
    expect(result.map((d) => d.date.getFullYear())).toEqual([1898, 1899])
    expect(result.map((d) => d.values.anomaly)).toEqual([-1.03, -1.11])
  })
})
