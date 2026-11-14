export const visualOptions = {
    marginTop: {
        type: 'number',
        label: 'Margin (top)',
        default: 40,
        group: 'artboard',
    },
    marginRight: {
        type: 'number',
        label: 'Margin (right)',
        default: 40,
        group: 'artboard',
    },
    marginBottom: {
        type: 'number',
        label: 'Margin (bottom)',
        default: 40,
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

    encoding: {
        type: 'text',
        label: 'Value is shown by',
        group: 'chart',
        options: [
            { label: 'Area', value: 'area' },
            { label: 'Radius', value: 'radius' },
        ],
        default: 'area',
    },

    innerRadius: {
        type: 'number',
        label: 'Inner radius (px)',
        default: 0,
        group: 'chart',
    },

    padAngle: {
        type: 'number',
        label: 'Gap between sectors (degrees)',
        default: 1,
        group: 'chart',
    },

    startAngle: {
        type: 'number',
        label: 'Start angle (degrees)',
        default: 0,
        group: 'chart',
    },

    sortBy: {
        type: 'text',
        label: 'Sort sectors by',
        group: 'chart',
        options: [
            { label: 'Original', value: 'original' },
            { label: 'Size (descending)', value: 'totalDescending' },
            { label: 'Size (ascending)', value: 'totalAscending' },
            { label: 'Name', value: 'name' },
        ],
        default: 'original',
    },

    showRings: {
        type: 'boolean',
        label: 'Show value rings',
        default: true,
        group: 'chart',
    },

    showLabels: {
        type: 'boolean',
        label: 'Show category labels',
        default: true,
        group: 'labels',
    },

    showValueLabels: {
        type: 'boolean',
        label: 'Show value labels',
        default: false,
        group: 'labels',
    },

    labelFontSize: {
        type: 'number',
        label: 'Label font size',
        default: 10,
        group: 'labels',
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
