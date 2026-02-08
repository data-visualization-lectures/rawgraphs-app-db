import * as d3 from 'd3'

export const mapData = function (data, mapping, dataTypes, dimensions) {
    const columnDim = dimensions.find((d) => d.id === 'column')
    const rowDim = dimensions.find((d) => d.id === 'row')
    const sizeDim = dimensions.find((d) => d.id === 'size')
    const colorDim = dimensions.find((d) => d.id === 'color')

    const results = data.map((d) => {
        return {
            column: d[mapping[columnDim.id].value],
            row: d[mapping[rowDim.id].value],
            size: mapping[sizeDim.id].value ? Number(d[mapping[sizeDim.id].value]) : 1, // Default to 1 if not mapped? Actually size is usually required.
            color: mapping[colorDim.id].value ? d[mapping[colorDim.id].value] : undefined,
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
        required: true,
        operation: 'get',
        aggregation: true, // Should we aggregate? Yes usually sum. But mapData handles raw rows mostly.
        // If the chart engine aggregates, we might need a different `mapData`.
        // For Custom Charts in v2, chart implementation usually handles raw data or simple mapping.
        // Let's assume input is raw data and we aggregate in render.js or here.
    },
    {
        id: 'color',
        name: 'Color',
        validTypes: ['number', 'date', 'string'],
        required: false,
        operation: 'get',
    },
]
