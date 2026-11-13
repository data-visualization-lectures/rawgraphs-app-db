import * as d3 from 'd3'
import { dateFormats } from '@rawgraphs/rawgraphs-core'
import { buildPyramid } from './mapping'

// Returns a function that turns a category / side value into the text to show.
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
    padding,
    centerGap,
    reverseOrder,
    usePercentage,
    showSideLabels,
    showValueLabels,
    labelFontSize,
    leftColor,
    rightColor,
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

  const { sides, categories } = buildPyramid(data)
  const categoryLabel = makeLabelFormatter(mapping.category)
  const sideLabel = makeLabelFormatter(mapping.side)

  const chartWidth = width - marginLeft - marginRight
  const chartHeight = height - marginTop - marginBottom
  const halfWidth = (chartWidth - centerGap) / 2

  if (halfWidth <= 0 || chartHeight <= 0) {
    throw new Error(
      'The chart area is too small. Decrease the margins or the center gap, or increase the artboard size.'
    )
  }
  if (padding * categories.length >= chartHeight) {
    throw new Error(
      'Padding is too high, decrease it in the panel "chart" > "Padding"'
    )
  }

  // values to draw: raw values, or share of the grand total
  const grandTotal = d3.sum(categories, (d) => d.left + d.right)
  const toShown = (v) =>
    usePercentage ? (grandTotal > 0 ? v / grandTotal : 0) : v
  const rows = categories.map((d, i) => ({
    index: i,
    category: d.category,
    left: toShown(d.left),
    right: toShown(d.right),
  }))

  // both sides share the same maximum, so bar lengths are comparable
  const maxValue = d3.max(rows, (d) => Math.max(d.left, d.right)) || 1
  const leftScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([halfWidth, 0])
  const rightScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([0, halfWidth])

  // the first category goes at the bottom unless the order is reversed
  const bandDomain = rows.map((d) => d.index)
  const bandScale = d3
    .scaleBand()
    .domain(reverseOrder ? bandDomain : bandDomain.slice().reverse())
    .range([0, chartHeight])
    // convert padding from px to a ratio of the band step
    .padding(padding / (chartHeight / rows.length))

  const rightOffset = halfWidth + centerGap
  const bandY = (d) => bandScale(d.index)
  const bandCenter = (d) => bandY(d) + bandScale.bandwidth() / 2
  const valueFormat = usePercentage ? d3.format('.1%') : d3.format(',.2~f')
  const tickCount = Math.max(2, Math.floor(halfWidth / 60))

  const viz = svg
    .append('g')
    .attr('id', 'viz')
    .attr('transform', `translate(${marginLeft},${marginTop})`)

  // left bars
  const leftGroup = viz.append('g').attr('id', 'left')
  leftGroup
    .selectAll('rect')
    .data(rows)
    .join('rect')
    .attr('class', 'bar-left')
    .attr('x', (d) => leftScale(d.left))
    .attr('y', bandY)
    .attr('width', (d) => halfWidth - leftScale(d.left))
    .attr('height', bandScale.bandwidth())
    .attr('fill', leftColor)
    .append('title')
    .text(
      (d) =>
        `${categoryLabel(d.category)} / ${sideLabel(sides[0])}: ${valueFormat(
          d.left
        )}`
    )

  // right bars
  const rightGroup = viz
    .append('g')
    .attr('id', 'right')
    .attr('transform', `translate(${rightOffset},0)`)
  rightGroup
    .selectAll('rect')
    .data(rows)
    .join('rect')
    .attr('class', 'bar-right')
    .attr('x', 0)
    .attr('y', bandY)
    .attr('width', (d) => rightScale(d.right))
    .attr('height', bandScale.bandwidth())
    .attr('fill', rightColor)
    .append('title')
    .text(
      (d) =>
        `${categoryLabel(d.category)} / ${sideLabel(sides[1])}: ${valueFormat(
          d.right
        )}`
    )

  // category labels in the central band
  viz
    .append('g')
    .attr('id', 'categoryLabels')
    .selectAll('text')
    .data(rows)
    .join('text')
    .attr('class', 'category-label')
    .attr('x', halfWidth + centerGap / 2)
    .attr('y', bandCenter)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .attr('font-family', 'Arial, sans-serif')
    .attr('font-size', 10)
    .text((d) => categoryLabel(d.category))

  // bottom axes, one for each side; ticks of the left axis are positive too
  leftGroup
    .append('g')
    .attr('id', 'leftAxis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(
      d3
        .axisBottom(leftScale)
        .ticks(tickCount)
        .tickFormat(usePercentage ? valueFormat : null)
    )
  rightGroup
    .append('g')
    .attr('id', 'rightAxis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(
      d3
        .axisBottom(rightScale)
        .ticks(tickCount)
        .tickFormat(usePercentage ? valueFormat : null)
    )

  // group names above each half
  if (showSideLabels) {
    const sideLabels = [
      { text: sideLabel(sides[0]), x: halfWidth / 2, cls: 'side-label-left' },
      {
        text: sideLabel(sides[1]),
        x: rightOffset + halfWidth / 2,
        cls: 'side-label-right',
      },
    ]
    viz
      .append('g')
      .attr('id', 'sideLabels')
      .selectAll('text')
      .data(sideLabels)
      .join('text')
      .attr('class', (d) => d.cls)
      .attr('x', (d) => d.x)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', 10)
      .attr('font-weight', 'bold')
      .attr('fill', 'black')
      .text((d) => d.text)
  }

  // values just outside the tip of each bar
  if (showValueLabels) {
    const labels = viz.append('g').attr('id', 'valueLabels')
    labels
      .selectAll('.value-label-left')
      .data(rows)
      .join('text')
      .attr('class', 'value-label-left')
      .attr('x', (d) => leftScale(d.left) - 3)
      .attr('y', bandCenter)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', labelFontSize)
      .attr('fill', 'black')
      .text((d) => valueFormat(d.left))
    labels
      .selectAll('.value-label-right')
      .data(rows)
      .join('text')
      .attr('class', 'value-label-right')
      .attr('x', (d) => rightOffset + rightScale(d.right) + 3)
      .attr('y', bandCenter)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'start')
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', labelFontSize)
      .attr('fill', 'black')
      .text((d) => valueFormat(d.right))
  }
}
