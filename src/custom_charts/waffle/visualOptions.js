export const visualOptions = {
    marginTop: {
        type: 'number',
        label: 'Margin (top)',
        default: 20,
        group: 'artboard',
    },
    marginRight: {
        type: 'number',
        label: 'Margin (right)',
        default: 20,
        group: 'artboard',
    },
    marginBottom: {
        type: 'number',
        label: 'Margin (bottom)',
        default: 20,
        group: 'artboard',
    },
    marginLeft: {
        type: 'number',
        label: 'Margin (left)',
        default: 20,
        group: 'artboard',
    },

    showLegend: {
        type: 'boolean',
        label: 'Show legend',
        default: true,
        group: 'artboard',
    },

    legendWidth: {
        type: 'number',
        label: 'Legend width',
        default: 200,
        group: 'artboard',
        disabled: {
            showLegend: false,
        },
        container: 'width',
        containerCondition: {
            showLegend: true,
        },
    },

    rows: {
        type: 'number',
        label: 'Rows',
        default: 10,
        group: 'chart',
    },

    columns: {
        type: 'number',
        label: 'Columns',
        default: 10,
        group: 'chart',
    },

    cellPadding: {
        type: 'number',
        label: 'Cell padding',
        default: 2,
        group: 'chart',
    },

    cellShape: {
        type: 'text',
        label: 'Cell shape',
        group: 'chart',
        options: [
            { label: 'Square', value: 'square' },
            { label: 'Circle', value: 'circle' },
        ],
        default: 'square',
    },

    fillDirection: {
        type: 'text',
        label: 'Fill direction',
        group: 'chart',
        options: [
            { label: 'Rows, from the top', value: 'rowsTop' },
            { label: 'Rows, from the bottom', value: 'rowsBottom' },
            { label: 'Columns, from the left', value: 'columnsLeft' },
        ],
        default: 'rowsTop',
    },

    sortBy: {
        type: 'text',
        label: 'Sort items by',
        group: 'chart',
        options: [
            { label: 'Original', value: 'original' },
            { label: 'Size (descending)', value: 'totalDescending' },
            { label: 'Size (ascending)', value: 'totalAscending' },
            { label: 'Name', value: 'name' },
        ],
        default: 'totalDescending',
    },

    colorScale: {
        type: 'colorScale',
        label: 'Color scale',
        dimension: 'category',
        default: {
            scaleType: 'ordinal',
            interpolator: 'interpolateSpectral',
        },
        group: 'colors',
    },
}
