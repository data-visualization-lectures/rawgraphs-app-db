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
        required: false,
        operation: 'get',
        aggregation: true,
        aggregationDefault: 'sum',
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

const sortings = {
    original: null,
    totalDescending: (a, b) => d3.descending(a.value, b.value),
    totalAscending: (a, b) => d3.ascending(a.value, b.value),
    name: (a, b) => compareCategories(a.category, b.category),
}

/**
 * Checks the values of the items returned by mapData and sorts them.
 * An empty cell is aggregated to null: it counts as 0.
 * The input is not modified. `label` turns a category into the text used in
 * the error messages.
 */
export const prepareItems = function (items, sortBy, label = String) {
    const rows = items.map((d) => ({
        category: d.category,
        value: d.value === null ? 0 : d.value,
    }))

    rows.forEach((d) => {
        if (typeof d.value !== 'number' || !Number.isFinite(d.value)) {
            throw new Error(
                `The "Value" dimension must contain only numbers (found "${d.value}" for ${label(d.category)}).`
            )
        }
        if (d.value < 0) {
            throw new Error(
                `A polar area chart cannot show negative values (found ${d.value} for ${label(d.category)}).`
            )
        }
    })

    // Array.prototype.sort is stable, so ties keep the input order
    const compare = sortings[sortBy]
    return compare ? rows.sort(compare) : rows
}

/**
 * Returns a function that converts a value (0 to maxValue) to a radius
 * (innerRadius to outerRadius).
 * encoding "area": the area of the sector, without the inner circle,
 * is proportional to the value.
 * encoding "radius": the length from the inner to the outer circle
 * is proportional to the value.
 */
export const radiusScaleFor = function (
    maxValue,
    innerRadius,
    outerRadius,
    encoding
) {
    if (encoding !== 'area' && encoding !== 'radius') {
        throw new Error(`Unknown encoding "${encoding}".`)
    }

    // when there is nothing to compare (maximum 0), every value is at the inner circle
    const share = (value) => (maxValue > 0 ? value / maxValue : 0)

    if (encoding === 'radius') {
        return (value) => innerRadius + (outerRadius - innerRadius) * share(value)
    }

    return (value) =>
        Math.sqrt(
            innerRadius * innerRadius +
                (outerRadius * outerRadius - innerRadius * innerRadius) *
                    share(value)
        )
}
