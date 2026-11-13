import * as d3 from 'd3'
import { dateFormats } from '@rawgraphs/rawgraphs-core'
import { isEmpty } from './mapping'

/*
Force-directed network graph.
The layout is computed synchronously with d3-force (no animation), so that the
exported SVG is static. d3-force starts nodes on a deterministic spiral and uses
its own seeded random source, so the same input always gives the same layout.
*/

const LABEL_GAP = 4

export default function render(
  svgNode,
  data,
  visualOptions,
  mapping,
  originalData,
  styles
) {
  const {
    // artboard
    width,
    height,
    background,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    // chart
    minDiameter,
    maxDiameter,
    nodeSize,
    linkDistance,
    chargeStrength,
    iterations,
    minLinkWidth,
    maxLinkWidth,
    linkOpacity,
    // labels
    showLabels,
    labelFontSize,
    // colors
    nodeColor,
    linkColor,
  } = visualOptions

  if (maxDiameter < minDiameter) {
    throw new Error('Max diameter must not be smaller than min diameter.')
  }
  if (maxLinkWidth < minLinkWidth) {
    throw new Error('Max link width must not be smaller than min link width.')
  }
  if (!Number.isFinite(iterations) || iterations < 0) {
    throw new Error(
      'Simulation steps must be a number greater than or equal to 0.'
    )
  }

  const margin = {
    top: marginTop,
    right: marginRight,
    bottom: marginBottom,
    left: marginLeft,
  }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // clear the svg, then add the background
  const root = d3.select(svgNode)
  root.selectAll('*').remove()

  root
    .append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', background)
    .attr('id', 'background')

  if (!data || data.length === 0) {
    return
  }

  if (chartWidth <= 0 || chartHeight <= 0) {
    throw new Error(
      'Margins are too large, decrease them in the panel "artboard"'
    )
  }

  // an empty cell is aggregated to null: it counts as 0
  const edges = data.map((d) => ({
    ...d,
    value: d.value === null ? 0 : d.value,
  }))
  edges.forEach((d) => {
    if (typeof d.value !== 'number' || !Number.isFinite(d.value)) {
      throw new Error(
        `The "Size" dimension must contain only numbers (found "${d.value}").`
      )
    }
    if (d.value < 0) {
      throw new Error(
        `The "Size" dimension cannot contain negative values (found ${d.value}).`
      )
    }
  })

  const graph = graphFromEdgesTable(edges)
  const formatDate = makeDateFormatter(mapping)

  if (typeof graph.nodes[0][nodeSize] !== 'number') {
    throw new Error('The selected node diameter option is not available.')
  }

  // node radius
  const radiusScale = d3
    .scaleSqrt()
    .domain([0, d3.max(graph.nodes, (d) => d[nodeSize])])
    .range([minDiameter / 2, maxDiameter / 2])
  graph.nodes.forEach((d) => {
    d.radius = radiusScale(d[nodeSize])
  })

  // a link from a node to itself has no length: it is not laid out nor drawn
  const links = graph.links.filter((d) => d.source !== d.target)

  // layout (synchronous)
  const simulation = d3
    .forceSimulation(graph.nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(linkDistance)
    )
    .force('charge', d3.forceManyBody().strength(chargeStrength))
    .force('center', d3.forceCenter(0, 0))
    // a weak pull to the center keeps unconnected nodes and groups close
    .force('x', d3.forceX(0).strength(0.08))
    .force('y', d3.forceY(0).strength(0.08))
    .force(
      'collide',
      d3.forceCollide().radius((d) => d.radius + 2)
    )
  simulation.stop()
  simulation.tick(iterations)

  // fit the layout in the drawing area, keeping the aspect ratio
  const labels = graph.nodes.map((d) => labelText(d.id, formatDate))
  const labelWidths = labels.map((text) =>
    showLabels ? LABEL_GAP + textWidth(text, labelFontSize) : 0
  )
  const labelHalfHeight = showLabels ? labelFontSize / 2 : 0

  const xs = graph.nodes.map((d) => d.x)
  const ys = graph.nodes.map((d) => d.y)
  const radii = graph.nodes.map((d) => d.radius)
  const xTrail = radii.map((r, i) => r + labelWidths[i])
  const yExtent = radii.map((r) => Math.max(r, labelHalfHeight))

  const scale = Math.min(
    maxScale(xs, radii, xTrail, chartWidth),
    maxScale(ys, yExtent, yExtent, chartHeight)
  )
  // the scale is not bounded when there is a single node (or all nodes coincide)
  const finalScale = Number.isFinite(scale) ? scale : 1

  const tx = centerOffset(xs, radii, xTrail, finalScale, chartWidth)
  const ty = centerOffset(ys, yExtent, yExtent, finalScale, chartHeight)
  graph.nodes.forEach((d) => {
    d.px = d.x * finalScale + tx
    d.py = d.y * finalScale + ty
  })

  // link width
  const [minValue, maxValue] = d3.extent(links, (d) => d.value)
  const widthScale =
    minValue === maxValue
      ? () => minLinkWidth
      : d3
          .scaleLinear()
          .domain([minValue, maxValue])
          .range([minLinkWidth, maxLinkWidth])

  const svg = root
    .append('g')
    .attr('id', 'viz')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // links first, nodes after
  svg
    .append('g')
    .attr('id', 'links')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('class', 'link')
    .attr('x1', (d) => d.source.px)
    .attr('y1', (d) => d.source.py)
    .attr('x2', (d) => d.target.px)
    .attr('y2', (d) => d.target.py)
    .attr('stroke', linkColor)
    .attr('stroke-opacity', linkOpacity)
    .attr('stroke-width', (d) => widthScale(d.value))

  svg
    .append('g')
    .attr('id', 'nodes')
    .selectAll('circle')
    .data(graph.nodes)
    .join('circle')
    .attr('class', 'node')
    .attr('cx', (d) => d.px)
    .attr('cy', (d) => d.py)
    .attr('r', (d) => d.radius)
    .attr('fill', nodeColor)

  if (showLabels) {
    svg
      .append('g')
      .attr('id', 'labels')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('class', 'label')
      .attr('x', (d) => d.px + d.radius + LABEL_GAP)
      .attr('y', (d) => d.py)
      .attr('dy', '0.35em')
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', labelFontSize)
      .attr('fill', '#000000')
      .text((d, i) => labels[i])
  }
}

/*
 Largest scale s such that, for every pair of nodes i and j with pos[i] > pos[j],
 s * (pos[i] - pos[j]) + trail[i] + lead[j] <= size.
 lead[k] / trail[k] are the extents of node k (circle and label) before / after its position.
 Returns Infinity when nothing bounds the scale (a single node, or all nodes aligned).
*/
function maxScale(pos, lead, trail, size) {
  let scale = Infinity
  for (let i = 0; i < pos.length; i++) {
    for (let j = 0; j < pos.length; j++) {
      const distance = pos[i] - pos[j]
      if (distance > 0) {
        scale = Math.min(scale, (size - trail[i] - lead[j]) / distance)
      }
    }
  }
  return Math.max(0, scale)
}

/*
 Translation that centers the scaled layout (circles and labels included) in [0, size].
*/
function centerOffset(pos, lead, trail, scale, size) {
  const min = d3.max(pos, (p, i) => lead[i] - p * scale)
  const max = d3.min(pos, (p, i) => size - trail[i] - p * scale)
  return (min + max) / 2
}

// jsdom and exported SVGs have no text measurement: full-width characters are about
// one em wide, the others about 0.6 em
function textWidth(text, fontSize) {
  let em = 0
  for (const char of text) {
    em += char.codePointAt(0) > 0x7f ? 1 : 0.6
  }
  return em * fontSize
}

// dates are shown in the format they were written in the dataset
function makeDateFormatter(mapping) {
  const dimension = [mapping.source, mapping.target].find(
    (d) =>
      d &&
      d.dataType &&
      d.dataType.type === 'date' &&
      dateFormats[d.dataType.dateFormat]
  )
  return dimension
    ? d3.timeFormat(dateFormats[dimension.dataType.dateFormat])
    : d3.timeFormat('%Y-%m-%d')
}

function labelText(id, formatDate) {
  if (id instanceof Date && !isNaN(id)) {
    return formatDate(id)
  }
  return String(id)
}

/*
 helper function to create a graph js object
 (same structure as the one used by the Arc diagram)
 */
function graphFromEdgesTable(_edgesTable) {
  // nodes are identified by value; dates by their timestamp
  const keyOf = (id) => (id instanceof Date ? id.getTime() : id)

  const nodeByKey = new Map()
  const nodeOf = (id) => {
    const key = keyOf(id)
    if (!nodeByKey.has(key)) {
      nodeByKey.set(key, {
        id,
        outLinks: [],
        inLinks: [],
        totalValue: 0,
        inValue: 0,
        outValue: 0,
        degree: 0,
        inDegree: 0,
        outDegree: 0,
        default: 1,
      })
    }
    return nodeByKey.get(key)
  }

  // links are a copy of the dataset, linked to the nodes objects
  // a row with an empty source or target adds its node, but no link
  const links = []
  _edgesTable.forEach(({ source, target, value }) => {
    if (isEmpty(source) || isEmpty(target)) {
      if (!isEmpty(source)) nodeOf(source)
      if (!isEmpty(target)) nodeOf(target)
      return
    }
    links.push({ source: nodeOf(source), target: nodeOf(target), value })
  })
  const nodes = Array.from(nodeByKey.values())

  for (const link of links) {
    const { source, target, value } = link
    // update source
    source.outLinks.push(link)
    source.totalValue += value
    source.outValue += value
    source.degree++
    source.outDegree++
    // update target
    target.inLinks.push(link)
    target.degree++
    target.inDegree++
    target.totalValue += value
    target.inValue += value
  }

  return { nodes, links }
}
