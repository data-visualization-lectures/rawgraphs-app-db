export const visualOptions = {
    maxRadius: {
        type: 'number',
        label: 'Max Radius',
        default: 400,
        group: 'chart',
    },

    strokeWidth: {
        type: 'number',
        label: 'Stroke Width',
        default: 2,
        group: 'chart',
    },

    color: {
        type: 'colorScale',
        label: 'Color Scale',
        dimension: 'series',
        default: {
            scaleType: 'ordinal',
            interpolator: 'interpolateSpectral',
        },
        group: 'colors',
    },

    columnsNumber: {
        type: 'number',
        label: 'Number of columns',
        default: 3,
        group: 'series',
    },

    sortSeriesBy: {
        type: 'text',
        label: 'Sort series by',
        group: 'series',
        options: [
            { label: 'Name', value: 'name' },
            { label: 'Total value (descending)', value: 'totalDescending' },
            { label: 'Total value (ascending)', value: 'totalAscending' },
        ],
        default: 'name',
    },

    showSeriesLabels: {
        type: 'boolean',
        label: 'Show series titles',
        default: true,
        group: 'series',
    },
}
