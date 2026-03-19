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

    colorTarget: {
        type: 'text',
        label: 'Color target',
        default: 'none',
        options: [
            { label: 'None', value: 'none' },
            { label: 'Value', value: 'value' },
            { label: 'Date', value: 'date' },
        ],
        group: 'colors',
    },

    colorScheme: {
        type: 'text',
        label: 'Color scheme',
        default: 'interpolateBlues',
        options: [
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
        disabled: { colorTarget: 'none' },
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
