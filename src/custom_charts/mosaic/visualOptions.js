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
        default: 40,
        group: 'artboard',
    },

    showLegend: {
        type: 'boolean',
        label: 'Show legend',
        default: false,
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

    padding: {
        type: 'number',
        label: 'Column Padding',
        default: 2,
        group: 'chart',
    },

    SortXAxisBy: {
        type: 'text',
        label: 'Sort X axis by',
        group: 'chart',
        options: [
            'Name',
            'Total value (descending)',
            'Total value (ascending)',
            'Original',
        ],
        default: 'Name',
    },

    showLabels: {
        type: 'boolean',
        label: 'Show labels',
        default: true,
        group: 'labels',
    },

    autoHideLabels: {
        type: 'boolean',
        label: 'Auto-hide overlapping labels',
        default: true,
        group: 'labels',
        disabled: {
            showLabels: false,
        },
    },

    labelFontSize: {
        type: 'number',
        label: 'Label font size',
        default: 10,
        group: 'labels',
        disabled: {
            showLabels: false,
        },
    },

    xAxisLabelRotation: {
        type: 'text',
        label: 'X axis label rotation',
        default: '0',
        group: 'chart',
        options: [
            { label: '0°', value: '0' },
            { label: '15°', value: '15' },
            { label: '30°', value: '30' },
            { label: '45°', value: '45' },
            { label: '60°', value: '60' },
        ],
    },

    color: {
        type: 'colorScale', // We want to color by category usually
        label: 'Color scale',
        dimension: 'color', // Use the 'color' dimension defined in mapping.js
        default: {
            scaleType: 'ordinal',
            interpolator: 'interpolateSpectral', // Default scheme
        },
        group: 'colors',
    },
}
