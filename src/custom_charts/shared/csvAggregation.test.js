import { mapData as waterfall, dimensions as waterfallDims } from '../waterfall/mapping'
import {
  mapData as pareto,
  dimensions as paretoDims,
  computePareto,
} from '../pareto/mapping'
import {
  mapData as pyramid,
  dimensions as pyramidDims,
  buildPyramid,
} from '../populationpyramid/mapping'
import { mapData as network, dimensions as networkDims } from '../forcenetwork/mapping'
import {
  mapData as waffle,
  dimensions as waffleDims,
  prepareItems as prepareWaffle,
} from '../waffle/mapping'
import {
  mapData as dumbbell,
  dimensions as dumbbellDims,
  prepareRows,
} from '../dumbbell/mapping'
import {
  mapData as polar,
  dimensions as polarDims,
  prepareItems as preparePolar,
} from '../polararea/mapping'

// The "CSV" aggregations of the core join the values as text: a single value
// 94 becomes "94". The charts of the RAWGraphs library draw it as a number;
// the custom charts must do the same, and explain the problem when the text
// is not a number ("128,94").
const dataTypes = {
  k: { type: 'string' },
  s: { type: 'string' },
  v: { type: 'number' },
  w: { type: 'number' },
}
const csv = (column) => ({ value: column, config: { aggregation: 'csv' } })
const oneRowEach = [
  { k: 'A', s: 'M', v: 128, w: 5 },
  { k: 'B', s: 'F', v: 94, w: 7 },
]
const twoRowsForA = [...oneRowEach, { k: 'A', s: 'M', v: 61, w: 9 }]

describe('CSV aggregation on items with a single row gives numbers', () => {
  test('waterfall', () => {
    const mapping = { category: { value: 'k' }, value: csv('v') }
    expect(waterfall(oneRowEach, mapping, dataTypes, waterfallDims)).toEqual([
      { category: 'A', value: 128 },
      { category: 'B', value: 94 },
    ])
  })

  test('pareto', () => {
    const mapping = { category: { value: 'k' }, value: csv('v') }
    const items = pareto(oneRowEach, mapping, dataTypes, paretoDims)
    expect(items.map((d) => d.value)).toEqual([128, 94])
    expect(() =>
      computePareto(items, { maxCategories: 0, othersLabel: 'Others' })
    ).not.toThrow()
  })

  test('population pyramid', () => {
    const mapping = { category: { value: 'k' }, side: { value: 's' }, value: csv('v') }
    const items = pyramid(oneRowEach, mapping, dataTypes, pyramidDims)
    expect(items.map((d) => d.value)).toEqual([128, 94])
    expect(() => buildPyramid(items)).not.toThrow()
  })

  test('network graph', () => {
    const mapping = { source: { value: 'k' }, target: { value: 's' }, size: csv('v') }
    const items = network(oneRowEach, mapping, dataTypes, networkDims)
    expect(items.map((d) => d.value)).toEqual([128, 94])
  })

  test('waffle chart', () => {
    const mapping = { category: { value: 'k' }, value: csv('v') }
    const items = waffle(oneRowEach, mapping, dataTypes, waffleDims)
    expect(items.map((d) => d.value)).toEqual([128, 94])
    expect(() => prepareWaffle(items)).not.toThrow()
  })

  test('dumbbell chart', () => {
    const mapping = { category: { value: 'k' }, startValue: csv('v'), endValue: csv('w') }
    const items = dumbbell(oneRowEach, mapping, dataTypes, dumbbellDims)
    expect(items.map((d) => [d.start, d.end])).toEqual([
      [128, 5],
      [94, 7],
    ])
    expect(() => prepareRows(items, 'original')).not.toThrow()
  })

  test('polar area chart', () => {
    const mapping = { category: { value: 'k' }, value: csv('v') }
    const items = polar(oneRowEach, mapping, dataTypes, polarDims)
    expect(items.map((d) => d.value)).toEqual([128, 94])
    expect(() => preparePolar(items, 'original')).not.toThrow()
  })
})

describe('CSV aggregation on items with several rows is reported clearly', () => {
  const expected = /needs one number.*"128,61".*aggregation/

  test('pareto', () => {
    const mapping = { category: { value: 'k' }, value: csv('v') }
    const items = pareto(twoRowsForA, mapping, dataTypes, paretoDims)
    expect(() =>
      computePareto(items, { maxCategories: 0, othersLabel: 'Others' })
    ).toThrow(expected)
  })

  test('population pyramid', () => {
    const mapping = { category: { value: 'k' }, side: { value: 's' }, value: csv('v') }
    expect(() =>
      buildPyramid(pyramid(twoRowsForA, mapping, dataTypes, pyramidDims))
    ).toThrow(expected)
  })

  test('waffle chart', () => {
    const mapping = { category: { value: 'k' }, value: csv('v') }
    expect(() =>
      prepareWaffle(waffle(twoRowsForA, mapping, dataTypes, waffleDims))
    ).toThrow(expected)
  })

  test('dumbbell chart', () => {
    const mapping = { category: { value: 'k' }, startValue: csv('v'), endValue: csv('w') }
    expect(() =>
      prepareRows(dumbbell(twoRowsForA, mapping, dataTypes, dumbbellDims), 'original')
    ).toThrow(expected)
  })

  test('polar area chart', () => {
    const mapping = { category: { value: 'k' }, value: csv('v') }
    expect(() =>
      preparePolar(polar(twoRowsForA, mapping, dataTypes, polarDims), 'original')
    ).toThrow(expected)
  })
})
