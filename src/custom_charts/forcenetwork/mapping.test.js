import { dimensions, mapData } from './mapping'

describe('Network graph data mapping', () => {
  const data = [
    { a: 'x', b: 'y', w: 1 },
    { a: 'x', b: 'y', w: 2 },
    { a: 'x', b: 'z', w: 5 },
    { a: 'y', b: 'x', w: 7 },
  ]
  const dataTypes = { a: 'string', b: 'string', w: 'number' }

  test('defines source, target (required) and size (optional, aggregated)', () => {
    expect(dimensions.map((d) => d.id)).toEqual(['source', 'target', 'size'])
    expect(dimensions.find((d) => d.id === 'source').required).toBe(true)
    expect(dimensions.find((d) => d.id === 'target').required).toBe(true)
    const size = dimensions.find((d) => d.id === 'size')
    expect(size.required).toBe(false)
    expect(size.aggregation).toBe(true)
    expect(size.validTypes).toEqual(['number'])
  })

  test('aggregates the size of rows with the same source and target', () => {
    const mapping = {
      source: { value: 'a' },
      target: { value: 'b' },
      size: { value: 'w', config: { aggregation: 'sum' } },
    }
    expect(mapData(data, mapping, dataTypes, dimensions)).toEqual([
      { source: 'x', target: 'y', value: 3 },
      { source: 'x', target: 'z', value: 5 },
      { source: 'y', target: 'x', value: 7 },
    ])
  })

  test('uses the aggregation selected for the size dimension', () => {
    const mapping = {
      source: { value: 'a' },
      target: { value: 'b' },
      size: { value: 'w', config: { aggregation: 'max' } },
    }
    const result = mapData(data, mapping, dataTypes, dimensions)
    expect(result[0].value).toBe(2)
  })

  test('value is 1 when size is not assigned', () => {
    const mapping = {
      source: { value: 'a' },
      target: { value: 'b' },
      size: { value: undefined },
    }
    const result = mapData(data, mapping, dataTypes, dimensions)
    expect(result).toHaveLength(3)
    expect(result.every((d) => d.value === 1)).toBe(true)
  })

  test('works when the size key is missing from the mapping', () => {
    const mapping = { source: { value: 'a' }, target: { value: 'b' } }
    const result = mapData(data, mapping, dataTypes, dimensions)
    expect(result.map((d) => d.value)).toEqual([1, 1, 1])
  })

  test('does not merge different pairs whose names concatenate to the same text', () => {
    const rows = [
      { a: 'ab', b: 'c' },
      { a: 'a', b: 'bc' },
    ]
    const mapping = { source: { value: 'a' }, target: { value: 'b' } }
    const result = mapData(
      rows,
      mapping,
      { a: 'string', b: 'string' },
      dimensions
    )
    expect(result).toEqual([
      { source: 'ab', target: 'c', value: 1 },
      { source: 'a', target: 'bc', value: 1 },
    ])
  })
})
