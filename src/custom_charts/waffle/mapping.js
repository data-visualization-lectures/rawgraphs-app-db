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

    // rows without a category are left out; d3.rollups keeps the order of
    // first appearance
    return d3
        .rollups(
            data.filter((d) => !isEmpty(d[categoryColumn])),
            (v) => ({
                category: formatCategory(v[0][categoryColumn]),
                // not mapped: count the rows
                value: mapping.value.value
                    ? valueAggregator(v.map((d) => d[mapping.value.value]))
                    : v.length,
            }),
            // String() to enable grouping on dates
            (d) => String(d[categoryColumn])
        )
        .map((d) => d[1])
}

/**
 * Checks the values of the items and returns copies where an empty value
 * (aggregated to null) is replaced by 0.
 */
export const prepareItems = function (items) {
    return items.map((d) => {
        const value = d.value === null || d.value === undefined ? 0 : d.value
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw new Error(
                `The "Value" dimension must contain only numbers (found "${d.value}" for ${d.category}).`
            )
        }
        if (value < 0) {
            throw new Error(
                `A waffle chart cannot show negative values (found ${value} for ${d.category}).`
            )
        }
        return { ...d, value }
    })
}

/**
 * Distributes totalCells among the items with the largest remainder method:
 * each item gets floor(share * totalCells) cells, then the cells left over go
 * one by one to the items with the largest fractional part (the first item in
 * the input order wins a tie). Returns the items with a `cells` property; the
 * sum of the cells is always totalCells.
 */
export const allocateCells = function (items, totalCells) {
    if (!Number.isInteger(totalCells) || totalCells < 1) {
        throw new Error('The number of cells must be an integer of 1 or more.')
    }

    const rows = prepareItems(items)
    const total = d3.sum(rows, (d) => d.value)
    if (!(total > 0)) {
        throw new Error(
            'The total of the values must be greater than 0 to draw a waffle chart.'
        )
    }

    const quotas = rows.map((d) => {
        // rounded to absorb floating point noise, so that equal fractional
        // parts are detected as ties
        const quota = Math.round(((d.value * totalCells) / total) * 1e9) / 1e9
        return { whole: Math.floor(quota), fraction: quota - Math.floor(quota) }
    })

    let remaining = totalCells - d3.sum(quotas, (q) => q.whole)

    // Array.prototype.sort is stable, so ties keep the input order
    const order = d3
        .range(rows.length)
        .sort((a, b) => d3.descending(quotas[a].fraction, quotas[b].fraction))
    const cells = quotas.map((q) => q.whole)
    for (const i of order) {
        if (remaining <= 0) break
        cells[i] += 1
        remaining -= 1
    }

    return rows.map((d, i) => ({ ...d, cells: cells[i] }))
}
