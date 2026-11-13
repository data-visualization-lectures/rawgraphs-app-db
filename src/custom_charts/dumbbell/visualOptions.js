export const visualOptions = {
  marginTop: {
    type: 'number',
    label: 'Margin (top)',
    default: 30,
    group: 'artboard',
  },
  marginRight: {
    type: 'number',
    label: 'Margin (right)',
    default: 30,
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
    default: 100,
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
    default: 150,
    group: 'artboard',
    disabled: {
      showLegend: false,
    },
    container: 'width',
    containerCondition: {
      showLegend: true,
    },
  },

  sortBy: {
    type: 'text',
    label: 'Sort by',
    group: 'chart',
    options: [
      { label: 'Original', value: 'original' },
      { label: 'Start value', value: 'start' },
      { label: 'End value', value: 'end' },
      { label: 'Difference', value: 'difference' },
      { label: 'Name', value: 'name' },
    ],
    default: 'original',
  },
  dotDiameter: {
    type: 'number',
    label: 'Dot diameter',
    default: 10,
    group: 'chart',
  },
  lineWidth: {
    type: 'number',
    label: 'Line width',
    default: 2,
    group: 'chart',
  },
  startAtZero: {
    type: 'boolean',
    label: 'Start the axis at 0',
    default: false,
    group: 'chart',
  },
  showGrid: {
    type: 'boolean',
    label: 'Show grid lines',
    default: true,
    group: 'chart',
  },

  showValueLabels: {
    type: 'boolean',
    label: 'Show value labels',
    default: false,
    group: 'labels',
  },
  labelFontSize: {
    type: 'number',
    label: 'Value label font size',
    default: 10,
    group: 'labels',
    disabled: {
      showValueLabels: false,
    },
  },

  startColor: {
    type: 'color',
    label: 'Start value color',
    default: '#5b8db8',
    group: 'colors',
  },
  endColor: {
    type: 'color',
    label: 'End value color',
    default: '#d1605e',
    group: 'colors',
  },
  lineColor: {
    type: 'color',
    label: 'Line color',
    default: '#bbbbbb',
    group: 'colors',
  },
}
