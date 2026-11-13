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

    // rows without a category are left out
    const rows = data.filter((d) => !isEmpty(d[categoryColumn]))

    // rollups keeps the order in which the categories first appear;
    // grouping on the formatted label also enables grouping on dates
    return d3
        .rollups(
            rows,
            (v) => ({
                category: formatCategory(v[0][categoryColumn]),
                // not mapped: count the rows
                value: mapping.value.value
                    ? valueAggregator(v.map((d) => d[mapping.value.value]))
                    : v.length,
            }),
            (d) => formatCategory(d[categoryColumn])
        )
        .map((d) => d[1])
}

const sortings = {
    original: null,
    totalDescending: (a, b) => d3.descending(a.value, b.value),
    totalAscending: (a, b) => d3.ascending(a.value, b.value),
    name: (a, b) => d3.ascending(a.category, b.category),
}

/**
 * Checks the values of the items returned by mapData and sorts them.
 * An empty cell is aggregated to null: it counts as 0.
 * The input is not modified.
 */
export const prepareItems = function (items, sortBy) {
    const rows = items.map((d) => ({
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
                `A polar area chart cannot show negative values (found ${d.value} for ${d.category}).`
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
