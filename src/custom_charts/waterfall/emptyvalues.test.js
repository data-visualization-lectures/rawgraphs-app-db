import { mapData as waterfall, dimensions as waterfallDimensions } from './mapping'
import { mapData as pareto, dimensions as paretoDimensions } from '../pareto/mapping'
import {
  mapData as pyramid,
  dimensions as pyramidDimensions,
} from '../populationpyramid/mapping'
import {
  mapData as network,
  dimensions as networkDimensions,
} from '../forcenetwork/mapping'

// The mean of the core counts an empty cell as 0: [empty, 4] gives 2.
// The charts leave empty cells out before aggregating.
describe('empty value cells are left out of the aggregation', () => {
  const dataTypes = { k: { type: 'string' }, s: { type: 'string' }, v: { type: 'number' } }
  const mean = { value: 'v', config: { aggregation: 'mean' } }
  const rows = [
    { k: 'A', s: 'M', v: null },
    { k: 'A', s: 'M', v: 4 },
    { k: 'B', s: 'M', v: null },
  ]

  test('waterfall', () => {
    const mapping = { category: { value: 'k' }, value: mean }
    expect(waterfall(rows, mapping, dataTypes, waterfallDimensions)).toEqual([
      { category: 'A', value: 4 },
      { category: 'B', value: null },
    ])
  })

  test('pareto', () => {
    const mapping = { category: { value: 'k' }, value: mean }
    const result = pareto(rows, mapping, dataTypes, paretoDimensions)
    expect(result.find((d) => d.category === 'A').value).toBe(4)
    expect(result.find((d) => d.category === 'B').value).toBe(null)
  })

  test('population pyramid', () => {
    const mapping = { category: { value: 'k' }, side: { value: 's' }, value: mean }
    expect(pyramid(rows, mapping, dataTypes, pyramidDimensions)).toEqual([
      { category: 'A', side: 'M', value: 4 },
      { category: 'B', side: 'M', value: null },
    ])
  })

  test('network graph', () => {
    const mapping = { source: { value: 'k' }, target: { value: 's' }, size: mean }
    expect(network(rows, mapping, dataTypes, networkDimensions)).toEqual([
      { source: 'A', target: 'M', value: 4 },
      { source: 'B', target: 'M', value: null },
    ])
  })
})
