import * as d3 from 'd3'
import { dateFormats, legend } from '@rawgraphs/rawgraphs-core'
import { prepareRows } from './mapping'

// Returns a function that turns a category value into the text to show.
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
    showLegend,
    legendWidth,
    sortBy,
    dotDiameter,
    lineWidth,
    startAtZero,
    showGrid,
    showValueLabels,
    labelFontSize,
    startColor,
    endColor,
    lineColor,
  } = visualOptions

  const svg = d3.select(svgNode)
  svg.selectAll('*').remove()

  svg
    .append('rect')
    .attr('id', 'background')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', showLegend ? width + legendWidth : width)
    .attr('height', height)
    .attr('fill', background)

  if (!data || data.length === 0) {
    return
  }

  const rows = prepareRows(data, sortBy)
  if (rows.length === 0) {
    return
  }

  const chartWidth = width - marginLeft - marginRight
  const chartHeight = height - marginTop - marginBottom
  if (chartWidth <= 0 || chartHeight <= 0) {
    throw new Error(
      'The chart area is too small. Decrease the margins or increase the artboard size.'
    )
  }

  const categoryLabel = makeLabelFormatter(mapping.category)
  const startName = mapping.startValue.value
  const endName = mapping.endValue.value
  const valueFormat = d3.format(',.2~f')
  const radius = dotDiameter / 2

  // items go from top to bottom in the order of `rows`
  const yScale = d3
    .scalePoint()
    .domain(rows.map((d) => d.category))
    .range([0, chartHeight])
    .padding(0.5)

  const values = rows.flatMap((d) => [d.start, d.end].filter((v) => v !== null))
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(startAtZero ? values.concat(0) : values))
    .nice()
    .range([0, chartWidth])

  const viz = svg
    .append('g')
    .attr('id', 'viz')
    .attr('transform', `translate(${marginLeft},${marginTop})`)

  if (showGrid) {
    viz
      .append('g')
      .attr('id', 'grid')
      .selectAll('line')
      .data(rows)
      .join('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', (d) => yScale(d.category))
      .attr('y2', (d) => yScale(d.category))
      .attr('stroke', '#e5e5e5')
      .attr('stroke-width', 1)
  }

  // lines first, dots on top; an item with a single value has no line
  viz
    .append('g')
    .attr('id', 'connectors')
    .selectAll('line')
    .data(rows.filter((d) => d.start !== null && d.end !== null))
    .join('line')
    .attr('class', 'connector')
    .attr('x1', (d) => xScale(d.start))
    .attr('x2', (d) => xScale(d.end))
    .attr('y1', (d) => yScale(d.category))
    .attr('y2', (d) => yScale(d.category))
    .attr('stroke', lineColor)
    .attr('stroke-width', lineWidth)

  const dots = viz.append('g').attr('id', 'dots')
  const drawDots = (className, key, name, color) => {
    dots
      .selectAll(`.${className}`)
      .data(rows.filter((d) => d[key] !== null))
      .join('circle')
      .attr('class', className)
      .attr('cx', (d) => xScale(d[key]))
      .attr('cy', (d) => yScale(d.category))
      .attr('r', radius)
      .attr('fill', color)
      .append('title')
      .text(
        (d) => `${categoryLabel(d.category)} / ${name}: ${valueFormat(d[key])}`
      )
  }
  drawDots('dot-start', 'start', startName, startColor)
  drawDots('dot-end', 'end', endName, endColor)

  // values just outside the dots: the smaller on the left, the larger on the right
  if (showValueLabels) {
    const labelPoints = rows.flatMap((d) => {
      if (d.start === null || d.end === null) {
        const value = d.start === null ? d.end : d.start
        return [{ category: d.category, value, side: 'right' }]
      }
      const startIsLeft = d.start <= d.end
      return [
        {
          category: d.category,
          value: d.start,
          side: startIsLeft ? 'left' : 'right',
        },
        {
          category: d.category,
          value: d.end,
          side: startIsLeft ? 'right' : 'left',
        },
      ]
    })
    viz
      .append('g')
      .attr('id', 'valueLabels')
      .selectAll('text')
      .data(labelPoints)
      .join('text')
      .attr('class', (d) => `value-label-${d.side}`)
      .attr('x', (d) =>
        d.side === 'left'
          ? xScale(d.value) - radius - 4
          : xScale(d.value) + radius + 4
      )
      .attr('y', (d) => yScale(d.category))
      .attr('dy', '0.35em')
      .attr('text-anchor', (d) => (d.side === 'left' ? 'end' : 'start'))
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', labelFontSize)
      .attr('fill', 'black')
      .text((d) => valueFormat(d.value))
  }

  // left axis: item names, no tick marks and no axis line
  const leftAxis = viz
    .append('g')
    .attr('id', 'categoryAxis')
    .call(
      d3
        .axisLeft(yScale)
        .tickSize(0)
        .tickPadding(radius + 4)
        .tickFormat(categoryLabel)
    )
  leftAxis.select('.domain').remove()
  leftAxis.selectAll('text').attr('font-family', 'Arial, sans-serif')

  // bottom axis: values
  const bottomAxis = viz
    .append('g')
    .attr('id', 'valueAxis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(xScale).ticks(Math.max(2, Math.floor(chartWidth / 80))))
  bottomAxis.selectAll('text').attr('font-family', 'Arial, sans-serif')

  if (showLegend) {
    const colorScale = d3
      .scaleOrdinal()
      .domain([startName, endName])
      .range([startColor, endColor])
    svg
      .append('g')
      .attr('id', 'legend')
      .attr('transform', `translate(${width},${marginTop})`)
      .call(legend().legendWidth(legendWidth).addColor('Values', colorScale))
  }
}
