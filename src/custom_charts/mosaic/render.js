import * as d3 from 'd3'
import { legend } from '@rawgraphs/rawgraphs-core'

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
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        color,
        padding,
        showLabels,
        xAxisLabelRotation,
        SortXAxisBy,
        autoHideLabels,
        showLegend,
        legendWidth,
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

    // Clear svg
    const svg = d3.select(svgNode)
    svg.selectAll('*').remove()

    if (!data || data.length === 0) {
        return
    }

    // 1. Process Data
    // Group by Column -> Row
    // Use d3.groups to get Map structure then iterate
    const nested = d3.rollups(
        data,
        v => ({
            size: d3.sum(v, d => d.size),
            color: v[0].color, // Take first color found in group
        }),
        d => d.column,
        d => d.row
    )

    // 2. Prepare Layout Data
    const columnSortings = {
        'Name': (a, b) => d3.ascending(a[0], b[0]),
        'Total value (descending)': (a, b) => d3.descending(
            d3.sum(a[1], d => d[1].size), d3.sum(b[1], d => d[1].size)
        ),
        'Total value (ascending)': (a, b) => d3.ascending(
            d3.sum(a[1], d => d[1].size), d3.sum(b[1], d => d[1].size)
        ),
        'Original': () => 0,
    }
    nested.sort(columnSortings[SortXAxisBy] || columnSortings['Name'])

    let totalSize = 0
    const columns = nested.map(([colKey, rowsMap]) => {
        // rowsMap is array of [rowKey, valueObj]
        // Sort rows alphabetically (or by size? usually alpha is safer for stacking consistency)
        rowsMap.sort((a, b) => d3.ascending(a[0], b[0]))

        const colTotal = d3.sum(rowsMap, d => d[1].size)
        totalSize += colTotal

        const rows = rowsMap.map(([rowKey, val]) => ({
            key: rowKey,
            size: val.size,
            color: val.color,
        }))

        return {
            key: colKey,
            total: colTotal,
            rows: rows,
        }
    })

    // 3. Layout Calculation
    // X Scale: 0 -> totalSize maps to 0 -> chartWidth
    const xScale = d3.scaleLinear()
        .domain([0, totalSize])
        .range([0, chartWidth])

    let currentX = 0
    const nodes = []

    columns.forEach(col => {
        const colWidth = xScale(col.total)

        // Y stacking (from bottom up)
        let currentY = 0
        // We start stacking from Y=chartHeight (value 0) up to Y=0 (value 100%)

        col.rows.forEach(row => {
            // Calculate height relative to column height (100%)
            const rowHeight = (row.size / col.total) * chartHeight

            // Calculate Y position
            // If stacking from bottom (y=chartHeight):
            // y = chartHeight - currentY - rowHeight
            const y = chartHeight - currentY - rowHeight

            nodes.push({
                x: currentX,
                y: y,
                width: Math.max(0, colWidth - padding), // Apply padding to width
                height: rowHeight,
                fill: color(row.color != null ? row.color : row.key), // Use mapped color or fallback to row key
                data: { column: col.key, row: row.key, size: row.size, color: row.color }
            })

            currentY += rowHeight
        })

        currentX += colWidth
    })

    // 4. Draw
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

    // Draw Rects
    g.selectAll('rect')
        .data(nodes)
        .join('rect')
        .attr('x', d => d.x + padding / 2) // Center padding
        .attr('y', d => d.y)
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('fill', d => d.fill)
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .append('title')
        .text(d => `${d.data.column} / ${d.data.row}\nSize: ${d.data.size}`)

    // 5. Axes / Labels
    // Y Axis (Percentage)
    const yScale = d3.scaleLinear().domain([0, 1]).range([chartHeight, 0])
    const yAxis = d3.axisLeft(yScale).tickFormat(d3.format('.0%'))

    g.append('g')
        .call(yAxis)

    // X Labels (Columns)
    // Calculate center of each column for label
    let labelX = 0
    const xLabels = columns.map(col => {
        const w = xScale(col.total)
        const center = labelX + w / 2
        labelX += w
        return { key: col.key, x: center, width: w }
    })

    if (showLabels) {
        const labels = g.selectAll('.xlabel')
            .data(xLabels)
            .join('text')
            .attr('class', 'xlabel')
            .attr('x', d => d.x)
            .attr('y', chartHeight + 15) // Below chart
            .attr('text-anchor', rotation !== 0 ? 'end' : 'middle')
            .attr('font-size', '10px')
            .text(d => d.key)
            // Hide if overlap? Simple hidden logic based on width
            .style('display', d => (autoHideLabels && d.width < 20) ? 'none' : null)

        if (rotation !== 0) {
            labels
                .attr('transform', d => `rotate(${-rotation}, ${d.x}, ${chartHeight + 15})`)
                .attr('dx', '-0.5em')
        }
    }

    // 6. Legend
    if (showLegend) {
        const legendLayer = d3
            .select(svgNode)
            .append('g')
            .attr('id', 'legend')
            .attr('transform', `translate(${width},${marginTop})`)

        const chartLegend = legend().legendWidth(legendWidth)

        if (mapping.color.value) {
            chartLegend.addColor(mapping.color.value, color)
        }

        legendLayer.call(chartLegend)
    }

}
