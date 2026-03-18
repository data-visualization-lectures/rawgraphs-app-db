export const visualOptions = {
    maxRadius: {
        type: 'number',
        label: 'Max radius',
        default: 400,
        group: 'chart',
    },

    strokeWidth: {
        type: 'number',
        label: 'Stroke width',
        default: 2,
        group: 'chart',
    },

    yearsPerCycle: {
        type: 'number',
        label: 'Years per cycle',
        default: 10,
        group: 'chart',
    },

    valueColorScheme: {
        type: 'text',
        label: 'Color by value',
        default: 'none',
        options: [
            { label: 'None', value: 'none' },
            { label: 'Viridis', value: 'interpolateViridis' },
            { label: 'Plasma', value: 'interpolatePlasma' },
            { label: 'Blues', value: 'interpolateBlues' },
            { label: 'Reds', value: 'interpolateReds' },
            { label: 'YlOrRd', value: 'interpolateYlOrRd' },
            { label: 'RdYlBu (diverging)', value: 'interpolateRdYlBu' },
            { label: 'RdBu (diverging)', value: 'interpolateRdBu' },
            { label: 'PiYG (diverging)', value: 'interpolatePiYG' },
        ],
        group: 'colors',
    },

    symmetricDomain: {
        type: 'boolean',
        label: 'Center color at 0',
        default: false,
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
