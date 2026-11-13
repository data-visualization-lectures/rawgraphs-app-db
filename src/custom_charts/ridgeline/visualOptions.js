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
    default: 100,
    group: 'artboard',
  },

  overlap: {
    type: 'number',
    label: 'Overlap (1 = no overlap)',
    default: 1.5,
    step: 0.1,
    min: 0,
    group: 'chart',
  },
  bandwidth: {
    type: 'number',
    label: 'Bandwidth (0 = automatic)',
    default: 0,
    min: 0,
    group: 'chart',
  },
  samples: {
    type: 'number',
    label: 'Curve resolution (points)',
    default: 100,
    min: 2,
    group: 'chart',
  },
  sameScale: {
    type: 'boolean',
    label: 'Use the same height scale for all groups',
    default: true,
    group: 'chart',
  },
  sortGroupsBy: {
    type: 'text',
    label: 'Sort groups by',
    options: [
      { label: 'Original', value: 'original' },
      { label: 'Name', value: 'name' },
      { label: 'Median (ascending)', value: 'medianAscending' },
      { label: 'Median (descending)', value: 'medianDescending' },
    ],
    default: 'original',
    group: 'chart',
  },
  curveType: {
    type: 'text',
    label: 'Curve type',
    options: [
      { label: 'Smooth', value: 'basis' },
      { label: 'Linear', value: 'linear' },
    ],
    default: 'basis',
    group: 'chart',
  },

  fillOpacity: {
    type: 'number',
    label: 'Fill opacity',
    default: 0.7,
    step: 0.1,
    min: 0,
    max: 1,
    group: 'colors',
  },
  strokeColor: {
    type: 'color',
    label: 'Outline color',
    default: '#ffffff',
    group: 'colors',
  },
  colorScale: {
    type: 'colorScale',
    label: 'Color scale',
    dimension: 'group',
    default: {
      scaleType: 'ordinal',
      interpolator: 'interpolateSpectral',
    },
    group: 'colors',
  },
}
