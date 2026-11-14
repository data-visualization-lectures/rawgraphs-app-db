import { dimensions, mapData, buildPyramid } from './mapping'

describe('Population pyramid mapData', () => {
  const data = [
    { age: '0-4', sex: 'M', pop: 10 },
    { age: '0-4', sex: 'F', pop: 20 },
    { age: '5-9', sex: 'F', pop: 30 },
    { age: '5-9', sex: 'M', pop: 40 },
    { age: '0-4', sex: 'M', pop: 5 },
  ]
  const dataTypes = {
    age: { type: 'string' },
    sex: { type: 'string' },
    pop: { type: 'number' },
  }
  const baseMapping = {
    category: { value: 'age' },
    side: { value: 'sex' },
    value: { value: 'pop' },
  }

  test('aggregates value per (category, side) and keeps first-appearance order', () => {
    const result = mapData(data, baseMapping, dataTypes, dimensions)
    expect(result).toEqual([
      { category: '0-4', side: 'M', value: 15 },
      { category: '0-4', side: 'F', value: 20 },
      { category: '5-9', side: 'F', value: 30 },
      { category: '5-9', side: 'M', value: 40 },
    ])
  })

  test('uses the aggregation chosen in the mapping', () => {
    const mapping = {
      ...baseMapping,
      value: { value: 'pop', config: { aggregation: 'mean' } },
    }
    const result = mapData(data, mapping, dataTypes, dimensions)
    expect(result[0]).toEqual({ category: '0-4', side: 'M', value: 7.5 })
  })

  test('groups Date categories by value', () => {
    const rows = [
      { age: new Date(2020, 0, 1), sex: 'M', pop: 1 },
      { age: new Date(2020, 0, 1), sex: 'M', pop: 2 },
      { age: new Date(2020, 0, 1), sex: 'F', pop: 4 },
    ]
    const result = mapData(rows, baseMapping, dataTypes, dimensions)
    expect(result).toHaveLength(2)
    expect(result[0].value).toBe(3)
  })

  test('declares the three required dimensions, value being aggregable', () => {
    expect(dimensions.map((d) => d.id)).toEqual(['category', 'side', 'value'])
    expect(dimensions.every((d) => d.required)).toBe(true)
    expect(dimensions.find((d) => d.id === 'value').aggregation).toBe(true)
  })
})

describe('buildPyramid', () => {
  test('returns sides and categories in first-appearance order', () => {
    const items = [
      { category: 'b', side: 'Men', value: 1 },
      { category: 'b', side: 'Women', value: 2 },
      { category: 'a', side: 'Women', value: 3 },
      { category: 'a', side: 'Men', value: 4 },
    ]
    expect(buildPyramid(items)).toEqual({
      sides: ['Men', 'Women'],
      categories: [
        { category: 'b', left: 1, right: 2 },
        { category: 'a', left: 4, right: 3 },
      ],
    })
  })

  test('uses 0 where a side has no value for a category', () => {
    const items = [
      { category: 'a', side: 'L', value: 5 },
      { category: 'b', side: 'R', value: 7 },
    ]
    expect(buildPyramid(items).categories).toEqual([
      { category: 'a', left: 5, right: 0 },
      { category: 'b', left: 0, right: 7 },
    ])
  })

  test('throws when the number of sides is not 2', () => {
    expect(() =>
      buildPyramid([{ category: 'a', side: 'L', value: 1 }])
    ).toThrow(/exactly 2.*but it has 1/)
    expect(() =>
      buildPyramid([
        { category: 'a', side: 'L', value: 1 },
        { category: 'a', side: 'R', value: 1 },
        { category: 'a', side: 'X', value: 1 },
      ])
    ).toThrow(/exactly 2.*but it has 3/)
  })

  test('throws on negative values', () => {
    expect(() =>
      buildPyramid([
        { category: 'a', side: 'L', value: -1 },
        { category: 'a', side: 'R', value: 1 },
      ])
    ).toThrow(/negative/)
  })

  test('throws on values that are not finite numbers', () => {
    expect(() =>
      buildPyramid([
        { category: 'a', side: 'L', value: NaN },
        { category: 'a', side: 'R', value: 1 },
      ])
    ).toThrow(/needs one number/)
  })
})
