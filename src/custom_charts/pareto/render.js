import * as d3 from 'd3'
import { computePareto } from './mapping'

export default function render(
    svgNode,
    data,
    visualOptions,
    mapping,
    originalData,
    styles
) {
    const {
        // artboard options
        width,
        height,
        background,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        // chart options
        padding,
        maxCategories,
        othersLabel,
        xAxisLabelRotation,
        showDots,
        showThreshold,
        threshold,
        // labels
        showValueLabels,
        labelFontSize,
        valueAxisTitle,
        cumulativeAxisTitle,
        // colors
        barColor,
        lineColor,
    } = visualOptions

    const rotation = Number(xAxisLabelRotation)

    const margin = {
        top: marginTop,
        right: marginRight,
        bottom: marginBottom,
        left: marginLeft,
    }

    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const svg = d3.select(svgNode)
    svg.selectAll('*').remove()

    // add background
    svg.append('rect')
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
            'Margins are too large, decrease them in the panel "artboard" > "Margin"'
        )
    }

    const items = computePareto(data, { maxCategories, othersLabel })

    // check if padding is too high and leave no space for bars
    if (padding * items.length > chartWidth) {
        throw new Error(
            'Padding is too high, decrease it in the panel "chart" > "Padding"'
        )
    }

    // bands are keyed by index, so that duplicated labels never collide
    const xScale = d3
        .scaleBand()
        .domain(d3.range(items.length))
        .range([0, chartWidth])
        //convert padding from px to percentage
        .padding(padding / (chartWidth / items.length))

    const valueScale = d3
        .scaleLinear()
        .domain([0, d3.max(items, (d) => d.value)])
        .nice()
        .range([chartHeight, 0])

    const cumulativeScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([chartHeight, 0])

    const percent = d3.format('.0%')

    const viz = svg
        .append('g')
        .attr('id', 'viz')
        .attr('transform', `translate(${margin.left},${margin.top})`)

    const centerX = (d, i) => xScale(i) + xScale.bandwidth() / 2

    // bars
    viz.append('g')
        .attr('id', 'bars')
        .selectAll('rect')
        .data(items)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', (d, i) => xScale(i))
        .attr('y', (d) => valueScale(d.value))
        .attr('width', xScale.bandwidth())
        .attr('height', (d) => Math.max(0, chartHeight - valueScale(d.value)))
        .attr('fill', barColor)
        .append('title')
        .text((d) => `${d.category}\n${d.value}`)

    // threshold line
    if (showThreshold) {
        const thresholdY = cumulativeScale(
            Math.min(100, Math.max(0, threshold)) / 100
        )
        viz.append('line')
            .attr('class', 'threshold')
            .attr('x1', 0)
            .attr('x2', chartWidth)
            .attr('y1', thresholdY)
            .attr('y2', thresholdY)
            .attr('stroke', lineColor)
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,4')
            .attr('fill', 'none')
    }

    // cumulative line
    viz.append('path')
        .datum(items)
        .attr('class', 'cumulative-line')
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 2)
        .attr(
            'd',
            d3
                .line()
                .x(centerX)
                .y((d) => cumulativeScale(d.cumulative))
        )

    if (showDots) {
        viz.append('g')
            .attr('id', 'dots')
            .selectAll('circle')
            .data(items)
            .join('circle')
            .attr('class', 'dot')
            .attr('cx', centerX)
            .attr('cy', (d) => cumulativeScale(d.cumulative))
            .attr('r', 3.5)
            .attr('fill', lineColor)
    }

    if (showValueLabels) {
        const labelFormat = d3.format('.1%')
        viz.append('g')
            .attr('id', 'valueLabels')
            .selectAll('text')
            .data(items)
            .join('text')
            .attr('class', 'value-label')
            .attr('x', centerX)
            .attr('y', (d) => cumulativeScale(d.cumulative) - 6)
            .attr('text-anchor', 'middle')
            .attr('font-family', 'Arial, sans-serif')
            .attr('font-size', labelFontSize)
            .attr('fill', 'black')
            .text((d) => labelFormat(d.cumulative))
    }

    // axis titles
    const valueMapping = mapping && mapping.value
    const automaticValueTitle =
        valueMapping && valueMapping.value
            ? valueMapping.config && valueMapping.config.aggregation
                ? `${valueMapping.value} [${valueMapping.config.aggregation}]`
                : valueMapping.value
            : 'Count'
    const valueTitle = valueAxisTitle || automaticValueTitle
    const categoryTitle =
        mapping && mapping.category && mapping.category.value
            ? mapping.category.value
            : ''

    const axisTitle = (g, text, x, y, anchor) =>
        g
            .append('text')
            .attr('font-family', 'Arial, sans-serif')
            .attr('font-size', 10)
            .attr('x', x)
            .attr('y', y)
            .attr('fill', 'black')
            .attr('font-weight', 'bold')
            .attr('text-anchor', anchor)
            .text(text)

    // left axis: value
    viz.append('g')
        .attr('id', 'yAxis')
        .call(d3.axisLeft(valueScale))
        .call((g) => axisTitle(g, valueTitle, 0, -8, 'start'))

    // right axis: cumulative share
    viz.append('g')
        .attr('id', 'yAxisRight')
        .attr('transform', `translate(${chartWidth},0)`)
        .call(d3.axisRight(cumulativeScale).tickFormat(percent))
        .call((g) => axisTitle(g, cumulativeAxisTitle || '', 0, -8, 'end'))

    // bottom axis: categories
    const xAxis = viz
        .append('g')
        .attr('id', 'xAxis')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(
            d3
                .axisBottom(xScale)
                .tickSizeOuter(0)
                .tickFormat((i) => items[i].category)
        )
        .call((g) => axisTitle(g, categoryTitle, chartWidth, -4, 'end'))

    if (rotation !== 0) {
        xAxis
            .selectAll('.tick text')
            .attr('transform', `rotate(${-rotation})`)
            .attr('text-anchor', 'end')
            .attr('dx', '-0.8em')
            .attr('dy', '0.15em')
    }
}
