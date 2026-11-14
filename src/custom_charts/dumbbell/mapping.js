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
    id: 'startValue',
    name: 'Start value',
    validTypes: ['number'],
    required: true,
    operation: 'get',
    aggregation: true,
    aggregationDefault: 'sum',
  },
  {
    id: 'endValue',
    name: 'End value',
    validTypes: ['number'],
    required: true,
    operation: 'get',
    aggregation: true,
    aggregationDefault: 'sum',
  },
]

// a cell left empty in the dataset
const isEmpty = (v) => v === null || v === undefined || v === ''

// Aggregates the non-empty cells of a group. When every cell is empty the
// result is null (an aggregator such as sum would return 0 for it).
const aggregateCells = (aggregator, values) => {
  const filled = values.filter((v) => !isEmpty(v))
  return filled.length === 0 ? null : aggregator(filled)
}

export const mapData = function (data, mapping, dataTypes, dimensions) {
  const startAggregator = getDimensionAggregator(
    'startValue',
    mapping,
    dataTypes,
    dimensions
  )
  const endAggregator = getDimensionAggregator(
    'endValue',
    mapping,
    dataTypes,
    dimensions
  )

  // InternMap groups Date objects by value, not by identity.
  // `results` keeps the order in which each category first appears.
  const groups = new d3.InternMap()
  const results = []

  data.forEach((row) => {
    const category = row[mapping.category.value]
    // rows without a category are left out
    if (isEmpty(category)) return
    if (!groups.has(category)) {
      const entry = { category, starts: [], ends: [] }
      groups.set(category, entry)
      results.push(entry)
    }
    const entry = groups.get(category)
    entry.starts.push(row[mapping.startValue.value])
    entry.ends.push(row[mapping.endValue.value])
  })

  return results.map(({ category, starts, ends }) => ({
    category,
    start: aggregateCells(startAggregator, starts),
    end: aggregateCells(endAggregator, ends),
  }))
}

const SORT_ACCESSORS = {
  start: (d) => d.start,
  end: (d) => d.end,
  difference: (d) =>
    d.start === null || d.end === null ? null : d.end - d.start,
}

const compareNames = (a, b) => {
  if (typeof a === 'number' && typeof b === 'number') return d3.ascending(a, b)
  if (a instanceof Date && b instanceof Date) return d3.ascending(a, b)
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

// Turns [{ category, start, end }] into the rows the chart is drawn from:
// validates the values, drops the items without any value and sorts them.
// A side without value stays null (it is not drawn, and it is not 0).
// Numeric sorts are descending (the largest on top); items with no value to
// sort by go last.
export const prepareRows = function (items, sortBy) {
  const rows = []
  items.forEach((d) => {
    ;[
      ['Start value', d.start],
      ['End value', d.end],
    ].forEach(([label, value]) => {
      if (isEmpty(value)) return
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(
          `The "${label}" dimension must contain only numbers (found "${value}" for ${d.category}).`
        )
      }
    })
    const start = isEmpty(d.start) ? null : d.start
    const end = isEmpty(d.end) ? null : d.end
    // items with no value at all are left out
    if (start === null && end === null) return
    rows.push({ category: d.category, start, end })
  })

  if (sortBy === 'name') {
    return rows.sort((a, b) => compareNames(a.category, b.category))
  }
  const accessor = SORT_ACCESSORS[sortBy]
  if (!accessor) return rows
  return rows.sort((a, b) => {
    const va = accessor(a)
    const vb = accessor(b)
    if (va === null || vb === null) {
      return va === vb ? 0 : va === null ? 1 : -1
    }
    return d3.descending(va, vb)
  })
}
