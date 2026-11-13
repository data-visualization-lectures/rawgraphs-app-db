import { mapData, computeSteps, dimensions } from './mapping'

describe('Waterfall mapData', () => {
  const data = [
    { item: 'Revenue', amount: 100 },
    { item: 'Cost', amount: -30 },
    { item: 'Revenue', amount: 20 },
    { item: 'Tax', amount: -10 },
    { item: 'Cost', amount: -5 },
  ]
  const dataTypes = { item: { type: 'string' }, amount: { type: 'number' } }

  test('aggregates values per category keeping the first-appearance order', () => {
    const mapping = {
      category: { value: 'item' },
      value: { value: 'amount', config: { aggregation: 'sum' } },
    }
    const result = mapData(data, mapping, dataTypes, dimensions)
    expect(result).toEqual([
      { category: 'Revenue', value: 120 },
      { category: 'Cost', value: -35 },
      { category: 'Tax', value: -10 },
    ])
  })

  test('uses the configured aggregation', () => {
    const mapping = {
      category: { value: 'item' },
      value: { value: 'amount', config: { aggregation: 'max' } },
    }
    const result = mapData(data, mapping, dataTypes, dimensions)
    expect(result.map((d) => d.value)).toEqual([100, -5, -10])
  })

  test('groups date categories by their value', () => {
    const d1 = new Date(2020, 0, 1)
    const rows = [
      { when: d1, amount: 1 },
      { when: new Date(2020, 0, 1), amount: 2 },
      { when: new Date(2020, 1, 1), amount: 3 },
    ]
    const mapping = {
      category: { value: 'when' },
      value: { value: 'amount', config: { aggregation: 'sum' } },
    }
    const result = mapData(
      rows,
      mapping,
      { when: { type: 'date' }, amount: { type: 'number' } },
      dimensions
    )
    expect(result.map((d) => d.value)).toEqual([3, 3])
    expect(result[0].category).toBe(d1)
  })
})

describe('computeSteps', () => {
  const items = [
    { category: 'A', value: 100 },
    { category: 'B', value: -30 },
    { category: 'C', value: 20 },
    { category: 'D', value: -120 },
  ]

  test('computes start, end and type with a total', () => {
    const steps = computeSteps(items, { showTotal: true, totalLabel: 'Total' })
    expect(steps).toEqual([
      { category: 'A', value: 100, start: 0, end: 100, type: 'increase' },
      { category: 'B', value: -30, start: 100, end: 70, type: 'decrease' },
      { category: 'C', value: 20, start: 70, end: 90, type: 'increase' },
      { category: 'D', value: -120, start: 90, end: -30, type: 'decrease' },
      { category: 'Total', value: -30, start: 0, end: -30, type: 'total' },
    ])
  })

  test('omits the total when showTotal is false', () => {
    const steps = computeSteps(items, { showTotal: false, totalLabel: 'Total' })
    expect(steps).toHaveLength(4)
    expect(steps.some((d) => d.type === 'total')).toBe(false)
  })

  test('does not mutate the input', () => {
    computeSteps(items, { showTotal: true, totalLabel: 'Total' })
    expect(items[0]).toEqual({ category: 'A', value: 100 })
  })

  test('handles empty input', () => {
    expect(computeSteps([], { showTotal: false, totalLabel: 'Total' })).toEqual(
      []
    )
    expect(computeSteps([], { showTotal: true, totalLabel: 'Total' })).toEqual([
      { category: 'Total', value: 0, start: 0, end: 0, type: 'total' },
    ])
  })
})
