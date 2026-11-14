import { mapData, dimensions } from './mapping'

const data = [
  { cls: '1st', sex: 'M', survived: 'no', n: 118 },
  { cls: '1st', sex: 'F', survived: 'yes', n: 140 },
]
const base = {
  column: { value: 'cls' },
  row: { value: 'survived' },
  size: { value: 'n' },
}

describe('Mekko chart mapData', () => {
  test('uses the mapped column for the color', () => {
    const mapping = { ...base, color: { value: 'sex' } }
    expect(mapData(data, mapping, {}, dimensions)).toEqual([
      { column: '1st', row: 'no', size: 118, color: 'M' },
      { column: '1st', row: 'yes', size: 140, color: 'F' },
    ])
  })

  test('colors by row when no column is mapped to the color', () => {
    const mapping = { ...base, color: { value: undefined } }
    expect(mapData(data, mapping, {}, dimensions).map((d) => d.color)).toEqual([
      'no',
      'yes',
    ])
  })

  test('colors by row when the color dimension is missing from the mapping', () => {
    expect(mapData(data, base, {}, dimensions).map((d) => d.color)).toEqual([
      'no',
      'yes',
    ])
  })

  test('the size has no aggregation to choose, and is not required', () => {
    const size = dimensions.find((d) => d.id === 'size')
    expect(size.aggregation).toBeUndefined()
    expect(size.required).toBe(false)
  })

  test('every row counts as 1 when no column is mapped to the size', () => {
    for (const mapping of [
      { column: { value: 'cls' }, row: { value: 'survived' } },
      { column: { value: 'cls' }, row: { value: 'survived' }, size: { value: undefined } },
    ]) {
      expect(mapData(data, mapping, {}, dimensions).map((d) => d.size)).toEqual([1, 1])
    }
  })
})
