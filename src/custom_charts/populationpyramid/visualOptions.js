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
    default: 20,
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
    default: 20,
    group: 'artboard',
  },

  padding: {
    type: 'number',
    label: 'Padding',
    default: 2,
    group: 'chart',
  },
  centerGap: {
    type: 'number',
    label: 'Center gap (category labels width)',
    default: 60,
    group: 'chart',
  },
  reverseOrder: {
    type: 'boolean',
    label: 'Reverse category order',
    default: false,
    group: 'chart',
  },
  usePercentage: {
    type: 'boolean',
    label: 'Show values as percentage of the total',
    default: false,
    group: 'chart',
  },

  showSideLabels: {
    type: 'boolean',
    label: 'Show group names',
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
    label: 'Value label font size',
    default: 10,
    group: 'labels',
    disabled: {
      showValueLabels: false,
    },
  },

  leftColor: {
    type: 'color',
    label: 'Left group color',
    default: '#5b8db8',
    group: 'colors',
  },
  rightColor: {
    type: 'color',
    label: 'Right group color',
    default: '#d1605e',
    group: 'colors',
  },
}
