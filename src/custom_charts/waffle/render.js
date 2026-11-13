import * as d3 from 'd3'
import { legend } from '@rawgraphs/rawgraphs-core'
import { prepareItems, allocateCells } from './mapping'

const sortings = {
    original: null,
    totalDescending: (a, b) => d3.descending(a.value, b.value),
    totalAscending: (a, b) => d3.ascending(a.value, b.value),
    name: (a, b) => d3.ascending(a.category, b.category),
}

// position (column, row) of the i-th cell, counted from the top left corner
const positions = {
    rowsTop: (i, rows, columns) => ({
        column: i % columns,
        row: Math.floor(i / columns),
    }),
    rowsBottom: (i, rows, columns) => ({
        column: i % columns,
        row: rows - 1 - Math.floor(i / columns),
    }),
    columnsLeft: (i, rows) => ({
        column: Math.floor(i / rows),
        row: i % rows,
    }),
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
        rows,
        columns,
        cellPadding,
        cellShape,
        fillDirection,
        sortBy,
        // colors
        colorScale,
    } = visualOptions

    const chartWidth = width - marginLeft - marginRight
    const chartHeight = height - marginTop - marginBottom

    const svg = d3.select(svgNode)
    svg.selectAll('*').remove()

    const totalWidth = showLegend ? width + legendWidth : width
    svg.attr('width', totalWidth).attr('height', height)

    // add background
    svg.append('rect')
        .attr('width', totalWidth)
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

    if (!Number.isInteger(rows) || rows < 1) {
        throw new Error(
            'Rows must be an integer of 1 or more, change it in the panel "chart" > "Rows"'
        )
    }
    if (!Number.isInteger(columns) || columns < 1) {
        throw new Error(
            'Columns must be an integer of 1 or more, change it in the panel "chart" > "Columns"'
        )
    }

    // cells are squares: the smaller of the two possible sizes fits both axes
    const cellSize = Math.min(chartWidth / columns, chartHeight / rows)
    const padding = Math.max(0, cellPadding)
    const shapeSize = cellSize - padding
    if (shapeSize <= 0) {
        throw new Error(
            'Cell padding is too high, decrease it in the panel "chart" > "Cell padding"'
        )
    }

    // the grid is centered in the drawing area
    const offsetX = (chartWidth - cellSize * columns) / 2
    const offsetY = (chartHeight - cellSize * rows) / 2

    // sort, then allocate: a tie for the last cells goes to the item shown first
    const sorted = prepareItems(data)
    if (sortings[sortBy]) sorted.sort(sortings[sortBy])
    const items = allocateCells(sorted, rows * columns)
    const total = d3.sum(items, (d) => d.value)

    const percent = d3.format('.1%')
    const number = d3.format(',')

    const cellData = items.flatMap((item) =>
        d3.range(item.cells).map(() => item)
    )

    const viz = svg
        .append('g')
        .attr('id', 'viz')
        .attr('transform', `translate(${marginLeft},${marginTop})`)

    const position = positions[fillDirection] || positions.rowsTop
    const centerOf = (d, i) => {
        const { column, row } = position(i, rows, columns)
        return {
            x: offsetX + (column + 0.5) * cellSize,
            y: offsetY + (row + 0.5) * cellSize,
        }
    }

    const cells = viz
        .append('g')
        .attr('id', 'cells')
        .selectAll(cellShape === 'circle' ? 'circle' : 'rect')
        .data(cellData)
        .join(cellShape === 'circle' ? 'circle' : 'rect')
        .attr('class', 'cell')
        .attr('fill', (d) => colorScale(d.category))

    if (cellShape === 'circle') {
        cells
            .attr('cx', (d, i) => centerOf(d, i).x)
            .attr('cy', (d, i) => centerOf(d, i).y)
            .attr('r', shapeSize / 2)
    } else {
        cells
            .attr('x', (d, i) => centerOf(d, i).x - shapeSize / 2)
            .attr('y', (d, i) => centerOf(d, i).y - shapeSize / 2)
            .attr('width', shapeSize)
            .attr('height', shapeSize)
    }

    cells
        .append('title')
        .text(
            (d) =>
                `${d.category}: ${number(d.value)} (${percent(d.value / total)})`
        )

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
