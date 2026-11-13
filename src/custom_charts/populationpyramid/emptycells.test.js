import { mapData, dimensions } from './mapping'

test('Population pyramid: rows without a category or a side are left out', () => {
  const data = [
    { age: '0-4', sex: 'M', pop: 1 },
    { age: '', sex: 'M', pop: 50 },
    { age: '0-4', sex: null, pop: 60 },
    { age: '0-4', sex: 'F', pop: 2 },
  ]
  const mapping = {
    category: { value: 'age' },
    side: { value: 'sex' },
    value: { value: 'pop', config: { aggregation: 'sum' } },
  }
  const dataTypes = {
    age: { type: 'string' },
    sex: { type: 'string' },
    pop: { type: 'number' },
  }
  expect(mapData(data, mapping, dataTypes, dimensions)).toEqual([
    { category: '0-4', side: 'M', value: 1 },
    { category: '0-4', side: 'F', value: 2 },
  ])
})
