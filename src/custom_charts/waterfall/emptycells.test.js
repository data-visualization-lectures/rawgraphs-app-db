import { mapData, dimensions } from './mapping'

test('Waterfall: rows without a category are left out', () => {
  const data = [
    { item: 'Revenue', amount: 100 },
    { item: '', amount: 7 },
    { item: null, amount: 9 },
    { item: 'Cost', amount: -30 },
  ]
  const mapping = {
    category: { value: 'item' },
    value: { value: 'amount', config: { aggregation: 'sum' } },
  }
  const dataTypes = { item: { type: 'string' }, amount: { type: 'number' } }
  expect(mapData(data, mapping, dataTypes, dimensions)).toEqual([
    { category: 'Revenue', value: 100 },
    { category: 'Cost', value: -30 },
  ])
})
