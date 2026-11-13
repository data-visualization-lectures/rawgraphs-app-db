import * as d3 from 'd3'
import { dateFormats } from '@rawgraphs/rawgraphs-core'
import {
  buildGroups,
  sortGroups,
  silvermanBandwidth,
  kernelDensity,
  isAssigned,
} from './mapping'

const curves = {
  basis: d3.curveBasis,
  linear: d3.curveLinear,
}

// Returns a function that turns a group value into the text to show.
function makeLabelFormatter(dimensionMapping) {
  const dataType = dimensionMapping && dimensionMapping.dataType
  if (
    dataType &&
    dataType.type === 'date' &&
    dateFormats[dataType.dateFormat]
  ) {
    const format = d3.timeFormat(dateFormats[dataType.dateFormat])
    return (value) => (value instanceof Date ? format(value) : String(value))
  }
  return (value) => String(value)
}

export default function render(
  svgNode,
  data,
  visualOptions,
  mapping,
  originalData,
  styles
) {
  const {
    width,
    height,
    background,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    overlap,
    bandwidth,
    samples,
    sameScale,
    sortGroupsBy,
    curveType,
    fillOpacity,
    strokeColor,
    colorScale,
  } = visualOptions

  const svg = d3.select(svgNode)
  svg.selectAll('*').remove()

  svg
    .append('rect')
    .attr('id', 'background')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height)
    .attr('fill', background)

  if (!data || data.length === 0) {
    return
  }

  if (!(samples >= 2)) {
    throw new Error(
      'The curve resolution must be at least 2 points, increase it in the panel "chart" > "Curve resolution (points)".'
    )
  }
  if (!(overlap > 0)) {
    throw new Error(
      'The overlap must be greater than 0, increase it in the panel "chart" > "Overlap".'
    )
  }
  if (!(bandwidth >= 0)) {
    throw new Error(
      'The bandwidth cannot be negative, use 0 for an automatic bandwidth.'
    )
  }
  if (!(curveType in curves)) {
    throw new Error(`Unknown curve type "${curveType}".`)
  }

  const chartWidth = width - marginLeft - marginRight
  const chartHeight = height - marginTop - marginBottom
  if (chartWidth <= 0 || chartHeight <= 0) {
    throw new Error(
      'The chart area is too small. Decrease the margins or increase the artboard size.'
    )
  }

  const hasGroup = isAssigned(mapping.group)
  const groupLabel = makeLabelFormatter(mapping.group)
  const groups = sortGroups(buildGroups(data), sortGroupsBy)

  // one bandwidth for every group, so the shapes can be compared
  const allValues = data.map((d) => d.value)
  const h = bandwidth > 0 ? bandwidth : silvermanBandwidth(allValues)

  // x scale shared by all groups
  const [minValue, maxValue] = d3.extent(allValues)
  const x = d3
    .scaleLinear()
    .domain([minValue - 3 * h, maxValue + 3 * h])
    .range([0, chartWidth])
  const pointCount = Math.floor(samples)
  const [x0, x1] = x.domain()
  const xs = d3
    .range(pointCount)
    .map((i) => x0 + ((x1 - x0) * i) / (pointCount - 1))

  const ridges = groups.map((g) => ({
    group: g.group,
    points: d3
      .zip(xs, kernelDensity(g.values, xs, h))
      .map(([px, density]) => ({ x: px, density })),
  }))

  // The top curve must fit above the first baseline, and the last baseline
  // is on the x axis: (k - 1) steps between baselines plus one curve height.
  const step = chartHeight / (groups.length - 1 + overlap)
  const maxHeight = overlap * step
  const baseline = (i) => chartHeight - (groups.length - 1 - i) * step

  const maxDensity = (r) => d3.max(r.points, (p) => p.density)
  const globalMaxDensity = d3.max(ridges, maxDensity)
  const heightScale = (r) =>
    d3
      .scaleLinear()
      .domain([0, sameScale ? globalMaxDensity : maxDensity(r)])
      .range([0, maxHeight])

  const viz = svg
    .append('g')
    .attr('id', 'viz')
    .attr('transform', `translate(${marginLeft},${marginTop})`)

  // top group first, so the groups below are drawn over it
  viz
    .append('g')
    .attr('id', 'ridges')
    .selectAll('path')
    .data(ridges)
    .join('path')
    .attr('class', 'ridge')
    .attr('d', (r, i) => {
      const y = heightScale(r)
      return d3
        .area()
        .curve(curves[curveType])
        .x((p) => x(p.x))
        .y0(baseline(i))
        .y1((p) => baseline(i) - y(p.density))(r.points)
    })
    .attr('fill', (r) => colorScale(r.group))
    .attr('fill-opacity', fillOpacity)
    .attr('stroke', strokeColor)
    .attr('stroke-width', 1)

  if (hasGroup) {
    viz
      .append('g')
      .attr('id', 'groupLabels')
      .selectAll('text')
      .data(ridges)
      .join('text')
      .attr('class', 'group-label')
      .attr('x', -8)
      .attr('y', (r, i) => baseline(i))
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', 10)
      .attr('fill', 'black')
      .text((r) => groupLabel(r.group))
  }

  viz
    .append('g')
    .attr('id', 'xAxis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(chartWidth / 80))))
    .attr('font-family', 'Arial, sans-serif')
}
