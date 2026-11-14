import * as d3 from 'd3'
import { legend, dateFormats } from '@rawgraphs/rawgraphs-core'
import { prepareItems, allocateCells, compareCategories } from './mapping'

// the largest number of cells (rows x columns) that is drawn
const MAX_CELLS = 10000

const sortings = {
    original: null,
    totalDescending: (a, b) => d3.descending(a.value, b.value),
    totalAscending: (a, b) => d3.ascending(a.value, b.value),
    name: (a, b) => compareCategories(a.category, b.category),
}

// Returns a function that turns a category value into the text to show: dates
// are written in the format of the input column, anything else with String().
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

    if (rows * columns > MAX_CELLS) {
        throw new Error(
            `Rows x Columns is ${rows * columns}, but at most ${MAX_CELLS} cells can be drawn. Decrease it in the panel "chart" > "Rows" or "Columns"`
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
    const categoryLabel = makeLabelFormatter(mapping && mapping.category)
    const sorted = prepareItems(data, categoryLabel)
    if (sortings[sortBy]) sorted.sort(sortings[sortBy])
    const items = allocateCells(sorted, rows * columns, categoryLabel)
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
                `${categoryLabel(d.category)}: ${number(d.value)} (${percent(d.value / total)})`
        )

    // legend
    if (showLegend) {
        const legendLayer = svg
            .append('g')
            .attr('id', 'legend')
            .attr('transform', `translate(${width},${marginTop})`)

        // the legend shows the labels, not the raw values of the categories;
        // two categories can have the same label (a date shown as month)
        const legendColors = new Map()
        items.forEach((d) => {
            const label = categoryLabel(d.category)
            if (!legendColors.has(label)) {
                legendColors.set(label, colorScale(d.category))
            }
        })
        const legendScale = d3
            .scaleOrdinal()
            .domain(Array.from(legendColors.keys()))
            .range(Array.from(legendColors.values()))

        const chartLegend = legend().legendWidth(legendWidth)
        chartLegend.addColor(
            mapping && mapping.category ? mapping.category.value : 'Category',
            legendScale
        )
        legendLayer.call(chartLegend)
    }
}
