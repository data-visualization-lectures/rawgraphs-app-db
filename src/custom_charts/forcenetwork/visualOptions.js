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

  minDiameter: {
    type: 'number',
    label: 'Min diameter',
    default: 4,
    group: 'chart',
  },

  maxDiameter: {
    type: 'number',
    label: 'Max diameter',
    default: 30,
    group: 'chart',
  },

  nodeSize: {
    type: 'text',
    label: 'Nodes diameter',
    group: 'chart',
    options: [
      { label: 'Same size', value: 'default' },
      { label: 'Weighted degree', value: 'totalValue' },
      { label: 'Weighted inDegree', value: 'inValue' },
      { label: 'Weighted outDegree', value: 'outValue' },
      { label: 'Links count', value: 'degree' },
      { label: 'OutDegree', value: 'outDegree' },
      { label: 'InDegree', value: 'inDegree' },
    ],
    default: 'totalValue',
  },

  linkDistance: {
    type: 'number',
    label: 'Link distance',
    default: 40,
    group: 'chart',
  },

  chargeStrength: {
    type: 'number',
    label: 'Repulsion strength (negative repels)',
    default: -120,
    group: 'chart',
  },

  iterations: {
    type: 'number',
    label: 'Simulation steps',
    default: 300,
    group: 'chart',
  },

  minLinkWidth: {
    type: 'number',
    label: 'Min link width',
    default: 1,
    group: 'chart',
  },

  maxLinkWidth: {
    type: 'number',
    label: 'Max link width',
    default: 6,
    group: 'chart',
  },

  linkOpacity: {
    type: 'number',
    label: 'Links opacity (0-1)',
    default: 0.5,
    step: 0.1,
    min: 0,
    max: 1,
    group: 'chart',
  },

  showLabels: {
    type: 'boolean',
    label: 'Show labels',
    default: true,
    group: 'labels',
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

  nodeColor: {
    type: 'color',
    label: 'Node color',
    default: '#5b8db8',
    group: 'colors',
  },

  linkColor: {
    type: 'color',
    label: 'Link color',
    default: '#999999',
    group: 'colors',
  },
}
