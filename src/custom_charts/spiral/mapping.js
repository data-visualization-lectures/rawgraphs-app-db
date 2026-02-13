import * as d3 from 'd3'
import { getDimensionAggregator } from '@rawgraphs/rawgraphs-core'

export const mapData = function (data, mapping, dataTypes, dimensions) {
    // 1. Definition of Aggregators
    // We need to define how to aggregate values if multiple rows fall into the same (Series, Date) bucket.
    // For 'value', we want to summing or averaging? 
    // Usually RawGraphs defaults to 'sum' for numbers.
    // However, since we allow multiple columns for value, we need to be careful.
    // The LineChart uses 'yAggregator'. We can use a custom aggregator or just take the first if we assume unique dates.
    // Let's stick to 'first' for now to be safe, because 'value' dimension is multiple.

    // 2. Add non-compulsory dimensions
    if (!('series' in mapping)) mapping.series = { value: undefined }

    let results = []

    // 3. Rollups (Standard Pattern)
    // We nest by Series -> Date.
    // We use the side-effect pattern to push to results.

    const seriesCol = mapping.series.value
    const dateCol = mapping.date.value
    // Value columns might be an array
    const valueColsRaw = mapping.value.value
    const valueCols = Array.isArray(valueColsRaw) ? valueColsRaw : [valueColsRaw].filter(Boolean)

    const result = d3.rollups(
        data,
        (v) => {
            // v is array of rows for this (Series, Date) group.
            // We take the first row's metadata.
            // And we extract values.

            // For values, we map each column.
            // Since we are inside a group, we theoretically have multiple rows.
            // But if date is unique per series, v has 1 row.
            // If we have duplicates, we should aggregate.
            // Let's take the First Valid Value for each column.

            const firstRow = v[0]
            const values = {}
            valueCols.forEach(col => {
                const validRow = v.find(d => d[col] !== undefined && d[col] !== "" && !isNaN(d[col]))
                values[col] = validRow ? Number(validRow[col]) : null
            })

            const item = {
                date: firstRow[dateCol],
                series: seriesCol ? firstRow[seriesCol] : undefined,
                values: values
            }
            results.push(item)
            return item
        },
        (d) => seriesCol ? d[seriesCol] : undefined, // Series Grouping
        (d) => d[dateCol] // Date Grouping (preserved as is, or toString if object)
    )

    return results
}

export const dimensions = [
    {
        id: 'date',
        name: 'Date (Angle)',
        validTypes: ['date'],
        required: true,
        operation: 'get',
    },
    {
        id: 'value',
        name: 'Value (Radius)',
        validTypes: ['number'],
        required: true,
        multiple: true, // Allow multiple columns
        operation: 'get',
    },
    {
        id: 'series',
        name: 'Series',
        validTypes: ['number', 'date', 'string'],
        required: false,
        multiple: false,
        operation: 'get',
    },
]
