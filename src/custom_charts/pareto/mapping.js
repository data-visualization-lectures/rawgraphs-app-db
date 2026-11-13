import * as d3 from 'd3'
import { getDimensionAggregator, dateFormats } from '@rawgraphs/rawgraphs-core'

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
        required: false,
        operation: 'get',
        aggregation: true,
        aggregationDefault: { number: 'sum' },
    },
]

// a cell left empty in the dataset
const isEmpty = (v) => v === null || v === undefined || v === ''

// Aggregates the cells that have a value. Empty cells are left out, so that
// they do not count as 0 in a mean; null is returned when all are empty.
const aggregatePresent = (aggregator, values) => {
    const present = values.filter((v) => !isEmpty(v))
    return present.length > 0 ? aggregator(present) : null
}

export const mapData = function (data, mapping, dataTypes, dimensions) {
    const valueAggregator = getDimensionAggregator(
        'value',
        mapping,
        dataTypes,
        dimensions
    )

    // add the non-compulsory dimension
    if (!('value' in mapping)) mapping.value = { value: undefined }

    const categoryColumn = mapping.category.value
    const categoryType = dataTypes ? dataTypes[categoryColumn] : undefined
    const dateFormat =
        categoryType && categoryType.type === 'date'
            ? dateFormats[categoryType.dateFormat]
            : undefined
    const formatCategory = dateFormat
        ? (v) => d3.timeFormat(dateFormat)(new Date(v))
        : (v) => String(v)

    // rows without a category are left out
    const results = d3
        .rollups(
            data.filter((d) => !isEmpty(d[categoryColumn])),
            (v) => ({
                category: formatCategory(v[0][categoryColumn]),
                // not mapped: count the rows
                value: mapping.value.value
                    ? aggregatePresent(
                          valueAggregator,
                          v.map((d) => d[mapping.value.value])
                      )
                    : v.length,
            }),
            // String() to enable grouping on dates
            (d) => String(d[categoryColumn])
        )
        .map((d) => d[1])

    // Array.prototype.sort is stable, so ties keep the input order
    return results.sort((a, b) => d3.descending(a.value, b.value))
}

/**
 * Adds the cumulative share to items already sorted by value, descending.
 * If maxCategories >= 1 and there are more items than that, the items after
 * the first maxCategories are merged into a single item labelled othersLabel.
 */
export const computePareto = function (items, { maxCategories, othersLabel }) {
    // an empty cell is aggregated to null: it counts as 0
    let rows = items.map((d) => ({
        category: d.category,
        value: d.value === null ? 0 : d.value,
    }))

    rows.forEach((d) => {
        if (typeof d.value !== 'number' || !Number.isFinite(d.value)) {
            throw new Error(
                `The "Value" dimension must contain only numbers (found "${d.value}" for ${d.category}).`
            )
        }
        if (d.value < 0) {
            throw new Error(
                `A Pareto chart cannot show negative values (found ${d.value} for ${d.category}).`
            )
        }
    })

    if (maxCategories >= 1 && rows.length > maxCategories) {
        const top = rows.slice(0, maxCategories)
        const others = rows.slice(maxCategories)
        top.push({
            category: othersLabel,
            value: d3.sum(others, (d) => d.value),
        })
        rows = top
    }

    const total = d3.sum(rows, (d) => d.value)
    if (!(total > 0)) {
        throw new Error(
            'The total of the values must be greater than 0 to draw a Pareto chart.'
        )
    }

    let running = 0
    return rows.map((d) => {
        running += d.value
        return { category: d.category, value: d.value, cumulative: running / total }
    })
}
