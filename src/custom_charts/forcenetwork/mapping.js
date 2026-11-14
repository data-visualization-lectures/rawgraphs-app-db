import { getDimensionAggregator } from '@rawgraphs/rawgraphs-core'
import { isEmpty, aggregatePresent } from '../shared/aggregation'

export const dimensions = [
  {
    id: 'source',
    name: 'Source node',
    validTypes: ['number', 'date', 'string'],
    required: true,
    operation: 'get',
  },
  {
    id: 'target',
    name: 'Target node',
    validTypes: ['number', 'date', 'string'],
    required: true,
    operation: 'get',
  },
  {
    id: 'size',
    name: 'Size',
    validTypes: ['number'],
    required: false,
    operation: 'get',
    aggregation: true,
    aggregationDefault: 'sum',
  },
]

export { isEmpty }

export const mapData = function (data, mapping, dataTypes, dimensions) {
  if (!('size' in mapping)) {
    mapping.size = { value: undefined }
  }

  const sizeAggregator = getDimensionAggregator(
    'size',
    mapping,
    dataTypes,
    dimensions
  )

  // group the rows by (source, target) pair, keeping the order of first appearance.
  // The key is built from both values as a JSON array, so that pairs like
  // ("ab", "c") and ("a", "bc") are never merged.
  const pairs = new Map()
  data.forEach((d) => {
    const source = d[mapping.source.value]
    const target = d[mapping.target.value]
    // a row with only one node is kept: that node is drawn without a link
    if (isEmpty(source) && isEmpty(target)) return
    const key = JSON.stringify([source, target])
    if (!pairs.has(key)) {
      pairs.set(key, { source, target, rows: [] })
    }
    pairs.get(key).rows.push(d)
  })

  return Array.from(pairs.values(), ({ source, target, rows }) => ({
    source,
    target,
    value: mapping.size.value
      ? aggregatePresent(
          sizeAggregator,
          rows.map((d) => d[mapping.size.value])
        )
      : 1,
  }))
}
