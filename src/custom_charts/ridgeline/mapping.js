import * as d3 from 'd3'

export const dimensions = [
  {
    id: 'value',
    name: 'Value',
    validTypes: ['number'],
    required: true,
    operation: 'get',
  },
  {
    id: 'group',
    name: 'Group',
    validTypes: ['number', 'date', 'string'],
    required: false,
    operation: 'get',
  },
]

// a cell left empty in the dataset
const isEmpty = (v) => v === null || v === undefined || v === ''

// true when a dimension has a column assigned to it
export const isAssigned = (dimensionMapping) =>
  !!dimensionMapping && !isEmpty(dimensionMapping.value)

// One row per observation. Rows without a value are left out; when a group is
// assigned, rows without a group are left out too.
// Without a group every row gets the group `undefined`: the core leaves
// undefined out of the color domain and gives the single curve its default
// color. (An empty string would be a color category of its own, and a
// one-category ordinal scale made from an interpolator is black.)
export const mapData = function (data, mapping) {
  if (!('group' in mapping)) mapping.group = { value: undefined }
  const hasGroup = isAssigned(mapping.group)

  const results = []
  data.forEach((row) => {
    const value = row[mapping.value.value]
    if (isEmpty(value)) return
    const group = hasGroup ? row[mapping.group.value] : undefined
    if (hasGroup && isEmpty(group)) return
    results.push({ group, value })
  })
  return results
}

// Groups the rows of mapData as [{ group, values }] in order of first appearance.
export const buildGroups = function (rows) {
  // InternMap groups Date objects by value, not by identity
  const byGroup = new d3.InternMap()
  const groups = []
  rows.forEach((d) => {
    if (typeof d.value !== 'number' || !Number.isFinite(d.value)) {
      throw new Error(
        `The "Value" dimension must contain only numbers (found "${d.value}").`
      )
    }
    if (!byGroup.has(d.group)) {
      const entry = { group: d.group, values: [] }
      byGroup.set(d.group, entry)
      groups.push(entry)
    }
    byGroup.get(d.group).values.push(d.value)
  })
  return groups
}

// Orders the groups from top to bottom. `groups` is not modified.
export const sortGroups = function (groups, sortGroupsBy) {
  const comparators = {
    original: null,
    name: (a, b) => d3.ascending(a.group, b.group),
    medianAscending: (a, b) =>
      d3.ascending(d3.median(a.values), d3.median(b.values)),
    medianDescending: (a, b) =>
      d3.descending(d3.median(a.values), d3.median(b.values)),
  }
  if (!(sortGroupsBy in comparators)) {
    throw new Error(`Unknown sort order "${sortGroupsBy}".`)
  }
  const sorted = groups.slice()
  // Array.prototype.sort is stable: ties keep the original order
  if (comparators[sortGroupsBy]) sorted.sort(comparators[sortGroupsBy])
  return sorted
}

// Silverman's rule of thumb: 0.9 * min(sd, IQR / 1.34) * n^(-1/5).
// The rule gives 0 when the values have no spread (one value, all values
// equal, or an IQR of 0), so in that case it falls back to, in order:
// the standard deviation, the size of the first value (|v|), and 1.
// The result is always a positive number.
export const silvermanBandwidth = function (values) {
  const n = values.length
  if (n === 0) return 1
  const sd = d3.deviation(values) || 0
  const sorted = values.slice().sort(d3.ascending)
  const iqr = d3.quantileSorted(sorted, 0.75) - d3.quantileSorted(sorted, 0.25)
  const spread = Math.min(sd, iqr / 1.34) || sd || Math.abs(values[0]) || 1
  return 0.9 * spread * Math.pow(n, -1 / 5)
}

// Kernel density estimate with a Gaussian kernel.
// Returns the density at each point of `xs`.
export const kernelDensity = function (values, xs, bandwidth) {
  if (!(bandwidth > 0) || !Number.isFinite(bandwidth)) {
    throw new Error('The bandwidth must be a positive number.')
  }
  const n = values.length
  if (n === 0) return xs.map(() => 0)
  const norm = 1 / (n * bandwidth * Math.sqrt(2 * Math.PI))
  return xs.map((x) => {
    let sum = 0
    for (let i = 0; i < n; i++) {
      const u = (x - values[i]) / bandwidth
      sum += Math.exp(-0.5 * u * u)
    }
    return sum * norm
  })
}
