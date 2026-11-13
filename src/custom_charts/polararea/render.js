import * as d3 from 'd3'
import { legend } from '@rawgraphs/rawgraphs-core'
import { prepareItems, radiusScaleFor } from './mapping'

const toRadians = (degrees) => (degrees * Math.PI) / 180

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
        showLegend,
        legendWidth,
        // chart options
        encoding,
        innerRadius,
        padAngle,
        startAngle,
        sortBy,
        showRings,
        // labels
        showLabels,
        showValueLabels,
        labelFontSize,
        // colors
        colorScale,
    } = visualOptions

    const chartWidth = width - marginLeft - marginRight
    const chartHeight = height - marginTop - marginBottom

    const svg = d3
        .select(svgNode)
        .attr('width', showLegend ? width + legendWidth : width)
        .attr('height', height)
    svg.selectAll('*').remove()

    // add background
    svg.append('rect')
        .attr('width', showLegend ? width + legendWidth : width)
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

    // the chart is centered in the drawing area
    const outerRadius = Math.min(chartWidth, chartHeight) / 2

    if (innerRadius < 0 || innerRadius >= outerRadius) {
        throw new Error(
            `Inner radius must be between 0 and ${outerRadius} (the outer radius of the chart), change it in the panel "chart" > "Inner radius (px)"`
        )
    }

    const items = prepareItems(data, sortBy)
    const maxValue = d3.max(items, (d) => d.value)
    const radiusOf = radiusScaleFor(maxValue, innerRadius, outerRadius, encoding)

    // every item has a sector of the same angle
    const sectorAngle = (2 * Math.PI) / items.length
    const firstAngle = toRadians(startAngle)
    const sectors = items.map((d, i) => ({
        category: d.category,
        value: d.value,
        startAngle: firstAngle + i * sectorAngle,
        endAngle: firstAngle + (i + 1) * sectorAngle,
        outerRadius: radiusOf(d.value),
    }))

    const arc = d3
        .arc()
        .innerRadius(innerRadius)
        .outerRadius((d) => d.outerRadius)
        .startAngle((d) => d.startAngle)
        .endAngle((d) => d.endAngle)
        .padAngle(toRadians(padAngle))

    const formatValue = d3.format(',')

    const viz = svg
        .append('g')
        .attr('id', 'viz')
        .attr(
            'transform',
            `translate(${marginLeft + chartWidth / 2},${
                marginTop + chartHeight / 2
            })`
        )

    // value rings, below the sectors
    const ringValues = showRings
        ? d3.ticks(0, maxValue, 4).filter((v) => v > 0)
        : []

    if (showRings) {
        viz.append('g')
            .attr('id', 'rings')
            .selectAll('circle')
            .data(ringValues)
            .join('circle')
            .attr('class', 'ring')
            .attr('r', (v) => radiusOf(v))
            .attr('fill', 'none')
            .attr('stroke', '#cccccc')
            .attr('stroke-width', 1)
    }

    // sectors
    const sectorPaths = viz
        .append('g')
        .attr('id', 'sectors')
        .selectAll('path')
        .data(sectors)
        .join('path')
        .attr('class', 'sector')
        .attr('d', (d) => arc(d))
        .attr('fill', (d) => colorScale(d.category))
    sectorPaths.append('title').text((d) => `${d.category}: ${d.value}`)

    // ring values, above the sectors, at the top of the chart
    if (showRings) {
        viz.append('g')
            .attr('id', 'ringLabels')
            .selectAll('text')
            .data(ringValues)
            .join('text')
            .attr('class', 'ring-label')
            .attr('x', 0)
            .attr('y', (v) => -radiusOf(v) - 2)
            .attr('text-anchor', 'middle')
            .attr('font-family', 'Arial, sans-serif')
            .attr('font-size', Math.max(labelFontSize - 2, 6))
            .attr('fill', '#666666')
            .attr('stroke', background)
            .attr('stroke-width', 3)
            .attr('paint-order', 'stroke')
            .text((v) => formatValue(v))
    }

    if (showValueLabels) {
        viz.append('g')
            .attr('id', 'valueLabels')
            .selectAll('text')
            .data(sectors.filter((d) => d.outerRadius > innerRadius))
            .join('text')
            .attr('class', 'value-label')
            .attr('transform', (d) => `translate(${arc.centroid(d)})`)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('font-family', 'Arial, sans-serif')
            .attr('font-size', labelFontSize)
            // black or white, whichever is readable on the sector
            .attr('fill', (d) =>
                d3.lab(colorScale(d.category)).l > 60 ? '#000000' : '#ffffff'
            )
            .text((d) => formatValue(d.value))
    }

    // category labels, just outside the circle of the largest sector
    if (showLabels) {
        const labelRadius = outerRadius + 6
        viz.append('g')
            .attr('id', 'labels')
            .selectAll('text')
            .data(sectors)
            .join('text')
            .attr('class', 'label')
            .each(function (d) {
                // angle measured clockwise from the top
                const angle = (d.startAngle + d.endAngle) / 2
                const sin = Math.sin(angle)
                const cos = Math.cos(angle)
                d3.select(this)
                    .attr('x', labelRadius * sin)
                    .attr('y', -labelRadius * cos)
                    // text starts at the circle on the right side, ends at it on the left side
                    .attr(
                        'text-anchor',
                        sin > 0.1 ? 'start' : sin < -0.1 ? 'end' : 'middle'
                    )
                    // above the circle at the top, below it at the bottom
                    .attr('dy', `${0.35 - 0.35 * cos}em`)
            })
            .attr('font-family', 'Arial, sans-serif')
            .attr('font-size', labelFontSize)
            .attr('fill', 'black')
            .text((d) => d.category)
    }

    // legend
    if (showLegend) {
        const legendLayer = svg
            .append('g')
            .attr('id', 'legend')
            .attr('transform', `translate(${width},${marginTop})`)

        const chartLegend = legend().legendWidth(legendWidth)
        chartLegend.addColor(mapping.category.value, colorScale)
        legendLayer.call(chartLegend)
    }
}
