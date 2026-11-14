import * as d3 from 'd3'
import { dateFormats } from '@rawgraphs/rawgraphs-core'
import { computeSteps } from './mapping'
import { notANumberMessage } from '../shared/aggregation'

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
    showTotal,
    totalLabel,
    showConnectors,
    xAxisLabelRotation,
    showValueLabels,
    labelFontSize,
    increaseColor,
    decreaseColor,
    totalColor,
  } = visualOptions

  const rotation = Number(xAxisLabelRotation)

  const margin = {
    top: marginTop,
    right: marginRight,
    bottom: marginBottom,
    left: marginLeft,
  }

  const svg = d3.select(svgNode)
  svg.selectAll('*').remove()

  // background
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

  const invalid = data.find((d) => !Number.isFinite(Number(d.value)))
  if (invalid) {
    throw new Error(notANumberMessage('Value', invalid.value, invalid.category))
  }

  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  if (chartWidth <= 0 || chartHeight <= 0) {
    throw new Error(
      'Margins are too high, decrease them in the panel "artboard"'
    )
  }

  const steps = computeSteps(
    data.map((d) => ({ category: d.category, value: Number(d.value) })),
    { showTotal, totalLabel }
  )

  // check if padding is too high and leave no space for bars
  if (padding * steps.length > chartWidth) {
    throw new Error(
      'Padding is too high, decrease it in the panel "chart" > "Padding"'
    )
  }

  // labels of the categories (dates are formatted as in the input data)
  const dateType = mapping.category && mapping.category.dataType
  const formatCategory =
    dateType && dateType.type === 'date' && dateFormats[dateType.dateFormat]
      ? (value) => d3.timeFormat(dateFormats[dateType.dateFormat])(new Date(value))
      : (value) => String(value)
  const labels = steps.map((d) =>
    d.type === 'total' ? String(d.category) : formatCategory(d.category)
  )

  // bands are indexed by position, so equal labels do not collapse
  const xScale = d3
    .scaleBand()
    .domain(steps.map((d, i) => i))
    .range([0, chartWidth])
    // convert padding from px to percentage
    .padding(padding / (chartWidth / steps.length))

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent([0, ...steps.flatMap((d) => [d.start, d.end])]))
    .nice()
    .range([chartHeight, 0])

  const colors = {
    increase: increaseColor,
    decrease: decreaseColor,
    total: totalColor,
  }

  const viz = svg
    .append('g')
    .attr('id', 'viz')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // bars
  viz
    .append('g')
    .attr('class', 'bars')
    .selectAll('rect')
    .data(steps)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', (d, i) => xScale(i))
    .attr('y', (d) => yScale(Math.max(d.start, d.end)))
    .attr('width', xScale.bandwidth())
    .attr('height', (d) => Math.abs(yScale(d.end) - yScale(d.start)))
    .attr('fill', (d) => colors[d.type])

  // connectors between the cumulative positions of adjacent bars
  if (showConnectors) {
    viz
      .append('g')
      .attr('class', 'connectors')
      .selectAll('line')
      .data(steps.slice(0, -1))
      .join('line')
      .attr('class', 'connector')
      .attr('x1', (d, i) => xScale(i) + xScale.bandwidth())
      .attr('x2', (d, i) => xScale(i + 1))
      .attr('y1', (d) => yScale(d.end))
      .attr('y2', (d) => yScale(d.end))
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
  }

  // value labels: above the bar, below it for decreases
  if (showValueLabels) {
    const formatValue = d3.format(',')
    const isBelow = (d) =>
      d.type === 'decrease' || (d.type === 'total' && d.value < 0)

    viz
      .append('g')
      .attr('class', 'value-labels')
      .selectAll('text')
      .data(steps)
      .join('text')
      .attr('class', 'value-label')
      .attr('x', (d, i) => xScale(i) + xScale.bandwidth() / 2)
      .attr('y', (d) =>
        isBelow(d)
          ? yScale(Math.min(d.start, d.end)) + 3
          : yScale(Math.max(d.start, d.end)) - 3
      )
      .attr('dominant-baseline', (d) => (isBelow(d) ? 'hanging' : 'auto'))
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', labelFontSize)
      .attr('fill', 'black')
      .text((d) =>
        d.type === 'increase'
          ? `+${formatValue(d.value)}`
          : formatValue(d.value)
      )
  }

  // zero baseline
  viz
    .append('line')
    .attr('id', 'zeroLine')
    .attr('x1', 0)
    .attr('x2', chartWidth)
    .attr('y1', yScale(0))
    .attr('y2', yScale(0))
    .attr('stroke', 'black')
    .attr('stroke-width', 1)

  // x axis
  const xAxis = viz
    .append('g')
    .attr('id', 'xAxis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(
      d3
        .axisBottom(xScale)
        .tickSizeOuter(0)
        .tickFormat((i) => labels[i])
    )

  if (rotation !== 0) {
    xAxis
      .selectAll('.tick text')
      .attr('transform', `rotate(${-rotation})`)
      .attr('text-anchor', 'end')
      .attr('dx', '-0.8em')
      .attr('dy', '0.15em')
  }

  // y axis
  viz
    .append('g')
    .attr('id', 'yAxis')
    .call(d3.axisLeft(yScale))
    .call((g) =>
      g
        .append('text')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', 10)
        .attr('x', 4)
        .attr('y', -22)
        .attr('fill', 'black')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'start')
        .text(() => {
          const column = mapping.value && mapping.value.value
          if (!column) return ''
          const aggregation =
            mapping.value.config && mapping.value.config.aggregation
          return aggregation ? `${column} [${aggregation}]` : column
        })
    )
}
