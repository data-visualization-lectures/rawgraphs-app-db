import { mapData, dimensions } from './mapping'

test('Pareto: rows without a category are left out', () => {
  const rows = [
    { cause: 'A', count: 10 },
    { cause: '', count: 99 },
    { cause: null, count: 99 },
    { cause: 'B', count: 30 },
  ]
  const mapping = {
    category: { value: 'cause' },
    value: { value: 'count', config: { aggregation: 'sum' } },
  }
  const dataTypes = { cause: { type: 'string' }, count: { type: 'number' } }
  expect(mapData(rows, mapping, dataTypes, dimensions)).toEqual([
    { category: 'B', value: 30 },
    { category: 'A', value: 10 },
  ])
})
