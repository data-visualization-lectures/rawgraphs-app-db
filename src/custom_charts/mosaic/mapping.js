

export const mapData = function (data, mapping, dataTypes, dimensions) {
    const columnDim = dimensions.find((d) => d.id === 'column')
    const rowDim = dimensions.find((d) => d.id === 'row')
    const sizeDim = dimensions.find((d) => d.id === 'size')
    const colorDim = dimensions.find((d) => d.id === 'color')

    const colorColumn = mapping[colorDim.id] && mapping[colorDim.id].value
    const sizeColumn = mapping[sizeDim.id] && mapping[sizeDim.id].value

    const results = data.map((d) => {
        const row = d[mapping[rowDim.id].value]
        return {
            column: d[mapping[columnDim.id].value],
            row,
            // The sizes of the rows of a segment are summed by the chart.
            // Without a column for the size, every row counts as 1.
            size: sizeColumn ? Number(d[sizeColumn]) : 1,
            // Without a column for the color, the segments are colored by row:
            // the color scale is built from these values, so each row gets
            // its own color (and its own entry in the options panel).
            color: colorColumn ? d[colorColumn] : row,
        }
    })

    return results
}

export const dimensions = [
    {
        id: 'column',
        name: 'Column (X Axis)',
        validTypes: ['number', 'date', 'string'],
        required: true,
        operation: 'get',
    },
    {
        id: 'row',
        name: 'Row (Segment)',
        validTypes: ['number', 'date', 'string'],
        required: true,
        operation: 'get',
    },
    {
        id: 'size',
        name: 'Size (Value)',
        validTypes: ['number'],
        // Not required: without it the chart counts the rows.
        // The dimension is not marked as aggregated on purpose: the chart
        // always sums the sizes, so the mapping panel must not offer a choice
        // of aggregation that would have no effect.
        required: false,
        operation: 'get',
    },
    {
        id: 'color',
        name: 'Color',
        validTypes: ['number', 'date', 'string'],
        required: false,
        operation: 'get',
    },
]
