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

    padding: {
        type: 'number',
        label: 'Column Padding',
        default: 2,
        group: 'chart',
    },

    showLabels: {
        type: 'boolean',
        label: 'Show Labels',
        default: true,
        group: 'labels',
    },

    color: {
        type: 'colorScale', // We want to color by category usually
        label: 'Color Scale',
        dimension: 'color', // Use the 'color' dimension defined in mapping.js
        default: {
            scaleType: 'ordinal',
            interpolator: 'interpolateSpectral', // Default scheme
        },
        group: 'colors',
    },
}
