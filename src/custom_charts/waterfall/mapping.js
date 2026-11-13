import * as d3 from 'd3'
import { getDimensionAggregator } from '@rawgraphs/rawgraphs-core'

export const dimensions = [
  {
    id: 'category',
    name: 'Category',
    validTypes: ['number', 'date', 'string'],
    required: true,
    operation: 'get',
  },
  {
    id: 'value',
    name: 'Value',
    validTypes: ['number'],
    required: true,
    operation: 'get',
    aggregation: true,
    aggregationDefault: 'sum',
  },
]

// a cell left empty in the dataset
const isEmpty = (v) => v === null || v === undefined || v === ''

export const mapData = function (data, mapping, dataTypes, dimensions) {
  const valueAggregator = getDimensionAggregator(
    'value',
    mapping,
    dataTypes,
    dimensions
  )

  const categoryColumn = mapping.category.value
  const valueColumn = mapping.value.value

  // group by the string form of the category (so that dates group correctly),
  // keeping the order of first appearance in the input
  // rows without a category are left out
  return d3
    .rollups(
      data.filter((d) => !isEmpty(d[categoryColumn])),
      (v) => ({
        category: v[0][categoryColumn],
        value: valueAggregator(v.map((d) => d[valueColumn])),
      }),
      (d) => String(d[categoryColumn])
    )
    .map((d) => d[1])
}

// Turns [{ category, value }] into waterfall steps. Each step gets the
// cumulative position where it starts and ends, and a type. If showTotal is
// true, a final bar with the cumulative total is appended.
export const computeSteps = function (items, { showTotal, totalLabel } = {}) {
  let cumulative = 0

  const steps = items.map((item) => {
    const start = cumulative
    const end = start + item.value
    cumulative = end
    return {
      ...item,
      start,
      end,
      type: item.value >= 0 ? 'increase' : 'decrease',
    }
  })

  if (showTotal) {
    steps.push({
      category: totalLabel,
      value: cumulative,
      start: 0,
      end: cumulative,
      type: 'total',
    })
  }

  return steps
}
