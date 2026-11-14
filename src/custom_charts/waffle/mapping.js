import * as d3 from 'd3'
import { getDimensionAggregator } from '@rawgraphs/rawgraphs-core'
import { isEmpty, aggregatePresent, notANumberMessage } from '../shared/aggregation'

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
    const valueColumn = mapping.value.value

    // The category is returned as it is in the dataset (Date, number or
    // string), so that the color scale receives the same type as the domain
    // built by the app. The label is made at render time.
    // InternMap groups Date objects by value, not by identity, and keeps the
    // order of first appearance. Rows without a category are left out.
    const groups = new d3.InternMap()
    data.forEach((row) => {
        const category = row[categoryColumn]
        if (isEmpty(category)) return
        if (!groups.has(category)) groups.set(category, { category, rows: [] })
        groups.get(category).rows.push(row)
    })

    return Array.from(groups.values(), ({ category, rows }) => ({
        category,
        // not mapped: count the rows
        value: valueColumn
            ? aggregatePresent(
                  valueAggregator,
                  rows.map((d) => d[valueColumn])
              )
            : rows.length,
    }))
}

/**
 * Compares two category values for the sorting by name: numbers by value,
 * dates by time, anything else as text where digit sequences are compared as
 * numbers ("2" before "10").
 */
export const compareCategories = function (a, b) {
    if (typeof a === 'number' && typeof b === 'number') return d3.ascending(a, b)
    if (a instanceof Date && b instanceof Date) {
        return d3.ascending(a.getTime(), b.getTime())
    }
    return String(a).localeCompare(String(b), undefined, { numeric: true })
}

/**
 * Checks the values of the items and returns copies where an empty value
 * (aggregated to null) is replaced by 0. `label` turns a category into the text
 * used in the error messages.
 */
export const prepareItems = function (items, label = String) {
    return items.map((d) => {
        const value = d.value === null || d.value === undefined ? 0 : d.value
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw new Error(
                notANumberMessage('Value', d.value, label(d.category))
            )
        }
        if (value < 0) {
            throw new Error(
                `A waffle chart cannot show negative values (found ${value} for ${label(d.category)}).`
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
 * sum of the cells is always totalCells. `label` is used in error messages.
 */
export const allocateCells = function (items, totalCells, label = String) {
    if (!Number.isInteger(totalCells) || totalCells < 1) {
        throw new Error('The number of cells must be an integer of 1 or more.')
    }

    const rows = prepareItems(items, label)
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
