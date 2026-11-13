import { dimensions, mapData, prepareRows } from './mapping'

describe('Dumbbell chart mapData', () => {
  const dataTypes = {
    subject: { type: 'string' },
    t1: { type: 'number' },
    t3: { type: 'number' },
  }
  const baseMapping = {
    category: { value: 'subject' },
    startValue: { value: 't1' },
    endValue: { value: 't3' },
  }

  test('aggregates both values per category and keeps first-appearance order', () => {
    const data = [
      { subject: 'b', t1: 1, t3: 10 },
      { subject: 'a', t1: 2, t3: 20 },
      { subject: 'b', t1: 3, t3: 30 },
    ]
    expect(mapData(data, baseMapping, dataTypes, dimensions)).toEqual([
      { category: 'b', start: 4, end: 40 },
      { category: 'a', start: 2, end: 20 },
    ])
  })

  test('uses the aggregation chosen in the mapping for each value', () => {
    const data = [
      { subject: 'a', t1: 2, t3: 10 },
      { subject: 'a', t1: 4, t3: 30 },
    ]
    const mapping = {
      ...baseMapping,
      startValue: { value: 't1', config: { aggregation: 'mean' } },
      endValue: { value: 't3', config: { aggregation: 'max' } },
    }
    expect(mapData(data, mapping, dataTypes, dimensions)).toEqual([
      { category: 'a', start: 3, end: 30 },
    ])
  })

  test('leaves out rows without a category', () => {
    const data = [
      { subject: 'a', t1: 1, t3: 2 },
      { subject: '', t1: 50, t3: 60 },
      { subject: null, t1: 50, t3: 60 },
      { subject: undefined, t1: 50, t3: 60 },
    ]
    expect(mapData(data, baseMapping, dataTypes, dimensions)).toEqual([
      { category: 'a', start: 1, end: 2 },
    ])
  })

  test('an empty value cell gives null, not 0', () => {
    const data = [
      { subject: 'a', t1: null, t3: 5 },
      { subject: 'b', t1: 3, t3: null },
      { subject: 'c', t1: null, t3: null },
    ]
    expect(mapData(data, baseMapping, dataTypes, dimensions)).toEqual([
      { category: 'a', start: null, end: 5 },
      { category: 'b', start: 3, end: null },
      { category: 'c', start: null, end: null },
    ])
  })

  test('several empty cells of one category still give null', () => {
    const data = [
      { subject: 'a', t1: null, t3: 1 },
      { subject: 'a', t1: null, t3: 1 },
    ]
    expect(mapData(data, baseMapping, dataTypes, dimensions)[0]).toEqual({
      category: 'a',
      start: null,
      end: 2,
    })
  })

  test('empty cells do not affect the aggregation of the others', () => {
    const data = [
      { subject: 'a', t1: null, t3: 1 },
      { subject: 'a', t1: 4, t3: 1 },
    ]
    const mapping = {
      ...baseMapping,
      startValue: { value: 't1', config: { aggregation: 'mean' } },
    }
    expect(mapData(data, mapping, dataTypes, dimensions)[0].start).toBe(4)
  })

  test('groups Date categories by value', () => {
    const data = [
      { subject: new Date(2020, 0, 1), t1: 1, t3: 10 },
      { subject: new Date(2020, 0, 1), t1: 2, t3: 20 },
    ]
    const result = mapData(data, baseMapping, dataTypes, dimensions)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ start: 3, end: 30 })
  })

  test('declares the three required dimensions, the two values being aggregable', () => {
    expect(dimensions.map((d) => d.id)).toEqual([
      'category',
      'startValue',
      'endValue',
    ])
    expect(dimensions.every((d) => d.required)).toBe(true)
    expect(dimensions.every((d) => d.operation === 'get')).toBe(true)
    expect(dimensions.find((d) => d.id === 'category').aggregation).toBeFalsy()
    ;['startValue', 'endValue'].forEach((id) => {
      const dim = dimensions.find((d) => d.id === id)
      expect(dim.validTypes).toEqual(['number'])
      expect(dim.aggregation).toBe(true)
      expect(dim.aggregationDefault).toBe('sum')
    })
  })
})

describe('prepareRows', () => {
  const items = [
    { category: 'a', start: 10, end: 30 }, // difference +20
    { category: 'c', start: 50, end: 40 }, // difference -10
    { category: 'b', start: 20, end: 25 }, // difference +5
  ]
  const names = (rows) => rows.map((d) => d.category)

  test('keeps the original order by default and for unknown keys', () => {
    expect(names(prepareRows(items, 'original'))).toEqual(['a', 'c', 'b'])
    expect(names(prepareRows(items, undefined))).toEqual(['a', 'c', 'b'])
    expect(names(prepareRows(items, 'unknown'))).toEqual(['a', 'c', 'b'])
  })

  test('numeric sorts are descending', () => {
    expect(names(prepareRows(items, 'start'))).toEqual(['c', 'b', 'a'])
    expect(names(prepareRows(items, 'end'))).toEqual(['c', 'a', 'b'])
    expect(names(prepareRows(items, 'difference'))).toEqual(['a', 'b', 'c'])
  })

  test('sorts by name in ascending order, numbers and dates by value', () => {
    expect(names(prepareRows(items, 'name'))).toEqual(['a', 'b', 'c'])
    const numbers = [
      { category: 10, start: 1, end: 1 },
      { category: 9, start: 1, end: 1 },
    ]
    expect(names(prepareRows(numbers, 'name'))).toEqual([9, 10])
    const dates = [
      { category: new Date(2021, 0, 1), start: 1, end: 1 },
      { category: new Date(2020, 0, 1), start: 1, end: 1 },
    ]
    expect(prepareRows(dates, 'name')[0].category).toEqual(new Date(2020, 0, 1))
  })

  test('does not modify the input', () => {
    const copy = items.map((d) => ({ ...d }))
    prepareRows(items, 'start')
    expect(items).toEqual(copy)
  })

  test('leaves out items whose two values are both empty', () => {
    const rows = prepareRows(
      [
        { category: 'a', start: null, end: null },
        { category: 'b', start: 1, end: 2 },
      ],
      'original'
    )
    expect(names(rows)).toEqual(['b'])
  })

  test('keeps an item with one empty value, which stays null', () => {
    const rows = prepareRows(
      [
        { category: 'a', start: null, end: 2 },
        { category: 'b', start: 1, end: null },
      ],
      'original'
    )
    expect(rows).toEqual([
      { category: 'a', start: null, end: 2 },
      { category: 'b', start: 1, end: null },
    ])
  })

  test('puts items without a value to sort by at the end', () => {
    const mixed = [
      { category: 'noStart', start: null, end: 100 },
      { category: 'low', start: 1, end: 2 },
      { category: 'noEnd', start: 50, end: null },
      { category: 'high', start: 9, end: 20 },
    ]
    expect(names(prepareRows(mixed, 'start'))).toEqual([
      'noEnd',
      'high',
      'low',
      'noStart',
    ])
    expect(names(prepareRows(mixed, 'end'))).toEqual([
      'noStart',
      'high',
      'low',
      'noEnd',
    ])
    // an item with a single value has no difference
    expect(names(prepareRows(mixed, 'difference'))).toEqual([
      'high',
      'low',
      'noStart',
      'noEnd',
    ])
  })

  test('throws a readable error on values that are not finite numbers', () => {
    expect(() =>
      prepareRows([{ category: 'a', start: 'abc', end: 1 }], 'original')
    ).toThrow(/"Start value" dimension must contain only numbers.*"abc".*a/)
    expect(() =>
      prepareRows([{ category: 'a', start: 1, end: NaN }], 'original')
    ).toThrow(/"End value" dimension must contain only numbers/)
    expect(() =>
      prepareRows([{ category: 'a', start: 1, end: Infinity }], 'original')
    ).toThrow(/only numbers/)
  })
})
