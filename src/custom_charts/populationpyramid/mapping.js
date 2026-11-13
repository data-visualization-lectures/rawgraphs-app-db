import * as d3 from 'd3'
import { getDimensionAggregator } from '@rawgraphs/rawgraphs-core'

export const dimensions = [
  {
    id: 'category',
    name: 'Category (age group)',
    validTypes: ['number', 'date', 'string'],
    required: true,
    operation: 'get',
  },
  {
    id: 'side',
    name: 'Side (two groups)',
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
    aggregationDefault: { number: 'sum' },
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

  // InternMap groups Date objects by value, not by identity.
  // `results` keeps the order in which each (category, side) pair first appears.
  const groups = new d3.InternMap()
  const results = []

  data.forEach((row) => {
    const category = row[mapping.category.value]
    const side = row[mapping.side.value]
    // rows without a category or a side are left out
    if (isEmpty(category) || isEmpty(side)) return
    if (!groups.has(category)) groups.set(category, new d3.InternMap())
    const bySide = groups.get(category)
    if (!bySide.has(side)) {
      const entry = { category, side, values: [] }
      bySide.set(side, entry)
      results.push(entry)
    }
    bySide.get(side).values.push(row[mapping.value.value])
  })

  return results.map(({ category, side, values }) => ({
    category,
    side,
    value: valueAggregator(values),
  }))
}

// Turns [{ category, side, value }] into the structure the pyramid is drawn from.
// sides: the two groups in order of first appearance (left, right).
// categories: classes in order of first appearance; a missing side counts as 0.
export const buildPyramid = function (rawItems) {
  // an empty cell is aggregated to null: it counts as 0
  const items = rawItems.map((d) => ({
    ...d,
    value: d.value === null ? 0 : d.value,
  }))
  const sides = Array.from(new d3.InternSet(items.map((d) => d.side)))
  if (sides.length !== 2) {
    throw new Error(
      `The "Side" dimension must have exactly 2 distinct values, but it has ${sides.length}.`
    )
  }

  items.forEach((d) => {
    if (typeof d.value !== 'number' || !Number.isFinite(d.value)) {
      throw new Error(
        `The "Value" dimension must contain only numbers (found "${d.value}" for ${d.category} / ${d.side}).`
      )
    }
    if (d.value < 0) {
      throw new Error(
        `The "Value" dimension cannot contain negative values (found ${d.value} for ${d.category} / ${d.side}).`
      )
    }
  })

  const sideIndex = new d3.InternMap(sides.map((side, i) => [side, i]))
  const byCategory = new d3.InternMap()
  const categories = []
  items.forEach((d) => {
    if (!byCategory.has(d.category)) {
      const entry = { category: d.category, left: 0, right: 0 }
      byCategory.set(d.category, entry)
      categories.push(entry)
    }
    const entry = byCategory.get(d.category)
    if (sideIndex.get(d.side) === 0) {
      entry.left += d.value
    } else {
      entry.right += d.value
    }
  })

  return { sides, categories }
}
