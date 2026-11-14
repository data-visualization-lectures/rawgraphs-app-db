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
        labelFontSize,
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
    // Group by Column -> Row -> Color.
    // A segment (column x row) can hold several color values, when the color
    // is mapped to a column that is neither the row nor the column: the
    // segment is then split into one part for each color value.
    const nested = d3
        .rollups(
            data,
            v => d3.sum(v, d => d.size),
            d => d.column,
            d => d.row,
            d => d.color
        )
        .map(([colKey, rowsMap]) => [
            colKey,
            rowsMap.map(([rowKey, parts]) => [
                rowKey,
                {
                    size: d3.sum(parts, d => d[1]),
                    parts: parts.map(([colorKey, size]) => ({ color: colorKey, size })),
                },
            ]),
        ])

    // The parts of every segment follow the same order: the one of the color
    // scale when it lists its values, otherwise the order of the names.
    const scaleDomain = typeof color.domain === 'function' ? color.domain() : []
    const colorRank = new Map(scaleDomain.map((value, i) => [String(value), i]))
    const compareColors = (a, b) => {
        const ra = colorRank.has(String(a.color)) ? colorRank.get(String(a.color)) : Infinity
        const rb = colorRank.has(String(b.color)) ? colorRank.get(String(b.color)) : Infinity
        if (ra !== rb) return ra - rb
        return String(a.color).localeCompare(String(b.color), undefined, { numeric: true })
    }

    // 2. Prepare Layout Data
    const columnSortings = {
        'Name': (a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }),
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
            parts: [...val.parts].sort(compareColors),
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
    // the segments (column x row), used to mark and name the rows
    const rowSegments = []

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

            rowSegments.push({
                x: currentX,
                y: y,
                width: Math.max(0, colWidth - padding),
                height: rowHeight,
                key: row.key,
                isTop: currentY + rowHeight >= chartHeight - 1e-6,
            })

            // The parts of the segment are stacked from the bottom, each one
            // as high as its share of the segment.
            let partY = y + rowHeight
            row.parts.forEach(part => {
                const partHeight = row.size > 0 ? (part.size / row.size) * rowHeight : 0
                partY -= partHeight
                nodes.push({
                    x: currentX,
                    y: partY,
                    width: Math.max(0, colWidth - padding), // Apply padding to width
                    height: partHeight,
                    fill: color(part.color),
                    data: { column: col.key, row: row.key, size: part.size, color: part.color }
                })
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
        .text(d => {
            const names = [d.data.column, d.data.row]
            // the color is named when it is not the row or the column itself
            if (!names.some(name => String(name) === String(d.data.color))) {
                names.push(d.data.color)
            }
            return `${names.join(' / ')}\nSize: ${d.data.size}`
        })

    // 5. Axes / Labels
    // Y Axis (Percentage)
    const yScale = d3.scaleLinear().domain([0, 1]).range([chartHeight, 0])
    const yAxis = d3.axisLeft(yScale).tickFormat(d3.format('.0%'))

    // When the color does not tell the rows apart (it is mapped to another
    // column), the rows are marked with a thicker line and named, otherwise
    // the reader cannot tell where a row ends and which one it is.
    const colorIsRow = nodes.every(d => String(d.data.color) === String(d.data.row))
    if (!colorIsRow) {
        g.append('g')
            .attr('id', 'row-separators')
            .selectAll('line')
            .data(rowSegments.filter(d => !d.isTop && d.height > 0))
            .join('line')
            .attr('x1', d => d.x + padding / 2)
            .attr('x2', d => d.x + padding / 2 + d.width)
            .attr('y1', d => d.y)
            .attr('y2', d => d.y)
            .attr('stroke', 'white')
            .attr('stroke-width', 3)

        if (showLabels) {
            g.append('g')
                .attr('id', 'row-labels')
                .selectAll('text')
                .data(rowSegments)
                .join('text')
                .attr('class', 'rowlabel')
                .attr('x', d => d.x + padding / 2 + 4)
                .attr('y', d => d.y + labelFontSize + 2)
                .attr('font-family', 'Arial, sans-serif')
                .attr('font-size', `${labelFontSize}px`)
                .attr('fill', 'black')
                .attr('stroke', 'white')
                .attr('stroke-width', 3)
                .attr('stroke-linejoin', 'round')
                .attr('paint-order', 'stroke')
                .text(d => d.key)
                // a label is hidden when its segment is too small for it
                .style('display', d =>
                    autoHideLabels &&
                    (d.height < labelFontSize + 6 ||
                        d.width < String(d.key).length * labelFontSize * 0.6 + 8)
                        ? 'none'
                        : null
                )
        }
    }

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
            .attr('font-size', `${labelFontSize}px`)
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

        // without a column for the color, the segments are colored by row
        const colorTitle =
            (mapping.color && mapping.color.value) || (mapping.row && mapping.row.value)
        if (colorTitle) {
            chartLegend.addColor(colorTitle, color)
        }

        legendLayer.call(chartLegend)
    }

}
