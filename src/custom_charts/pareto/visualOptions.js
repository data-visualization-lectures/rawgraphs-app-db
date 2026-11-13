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
        default: 50,
        group: 'artboard',
    },
    marginBottom: {
        type: 'number',
        label: 'Margin (bottom)',
        default: 30,
        group: 'artboard',
    },
    marginLeft: {
        type: 'number',
        label: 'Margin (left)',
        default: 50,
        group: 'artboard',
    },

    padding: {
        type: 'number',
        label: 'Padding',
        default: 2,
        group: 'chart',
    },

    maxCategories: {
        type: 'number',
        label: 'Max categories (0 = all)',
        default: 0,
        group: 'chart',
    },

    othersLabel: {
        type: 'text',
        label: 'Label for merged categories',
        default: 'Others',
        group: 'chart',
        disabled: {
            maxCategories: 0,
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

    showDots: {
        type: 'boolean',
        label: 'Show dots on the line',
        default: true,
        group: 'chart',
    },

    showThreshold: {
        type: 'boolean',
        label: 'Show threshold line',
        default: true,
        group: 'chart',
    },

    threshold: {
        type: 'number',
        label: 'Threshold (%)',
        default: 80,
        group: 'chart',
        disabled: {
            showThreshold: false,
        },
    },

    showValueLabels: {
        type: 'boolean',
        label: 'Show cumulative % labels',
        default: false,
        group: 'labels',
    },

    labelFontSize: {
        type: 'number',
        label: 'Label font size',
        default: 10,
        group: 'labels',
        disabled: {
            showValueLabels: false,
        },
    },

    valueAxisTitle: {
        type: 'text',
        label: 'Left axis title (empty = automatic)',
        default: '',
        group: 'labels',
    },

    cumulativeAxisTitle: {
        type: 'text',
        label: 'Right axis title',
        default: 'Cumulative %',
        group: 'labels',
    },

    barColor: {
        type: 'color',
        label: 'Bar color',
        default: '#5b8db8',
        group: 'colors',
    },

    lineColor: {
        type: 'color',
        label: 'Line color',
        default: '#d1605e',
        group: 'colors',
    },
}
