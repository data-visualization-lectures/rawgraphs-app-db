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
    default: 10,
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
    default: 4,
    group: 'chart',
  },

  showTotal: {
    type: 'boolean',
    label: 'Show total',
    default: true,
    group: 'chart',
  },

  totalLabel: {
    type: 'text',
    label: 'Total label',
    default: 'Total',
    group: 'chart',
    disabled: {
      showTotal: false,
    },
  },

  showConnectors: {
    type: 'boolean',
    label: 'Show connectors',
    default: true,
    group: 'chart',
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

  showValueLabels: {
    type: 'boolean',
    label: 'Show value labels',
    default: true,
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

  increaseColor: {
    type: 'color',
    label: 'Increase color',
    default: '#4e9a6b',
    group: 'colors',
  },

  decreaseColor: {
    type: 'color',
    label: 'Decrease color',
    default: '#d1605e',
    group: 'colors',
  },

  totalColor: {
    type: 'color',
    label: 'Total color',
    default: '#5b7083',
    group: 'colors',
  },
}
