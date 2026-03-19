import * as d3 from 'd3'
import { gridding } from 'd3-gridding'

// Detect whether data is yearly (all dates are Jan 1) or sub-yearly
function detectTimeUnit(data) {
    if (data.length < 2) return 'month'
    const sorted = [...data].sort((a, b) => a.date - b.date)
    const gaps = []
    for (let i = 1; i < Math.min(sorted.length, 20); i++) {
        gaps.push((sorted[i].date - sorted[i - 1].date) / 86400000)
    }
    gaps.sort((a, b) => a - b)
    const medianGap = gaps[Math.floor(gaps.length / 2)]
    return medianGap > 300 ? 'year' : 'month'
}

// Diverging schemes that should be reversed (so blue=low, red=high)
const DIVERGING_REVERSED = ['interpolateRdYlBu', 'interpolateRdBu']
const DIVERGING_SCHEMES = ['interpolateRdYlBu', 'interpolateRdBu', 'interpolatePiYG']

function buildValueColorScale(allValues, colorScheme, symmetric) {
    const interpolator = d3[colorScheme]
    if (!interpolator) return () => '#666'

    const extent = d3.extent(allValues)
    let domain
    if (symmetric && DIVERGING_SCHEMES.includes(colorScheme)) {
        const absMax = Math.max(Math.abs(extent[0]), Math.abs(extent[1]))
        domain = [-absMax, absMax]
    } else {
        domain = extent
    }

    if (DIVERGING_REVERSED.includes(colorScheme)) {
        return d3.scaleSequential(t => interpolator(1 - t)).domain(domain)
    }
    return d3.scaleSequential(interpolator).domain(domain)
}

function drawColoredSegments(parentGroup, validPoints, getAngle, rScale, valueKey, colorScale, strokeWidth, colorTarget) {
    const points = validPoints.map(d => {
        const angle = getAngle(d)
        const v = d.values[valueKey]
        const r = (v !== undefined && v !== null && !isNaN(v)) ? rScale(v) : 0
        return {
            x: Math.sin(angle) * r,
            y: -Math.cos(angle) * r,
            value: v,
            date: d.date.getTime()
        }
    })

    const segmentGroup = parentGroup.append('g').attr('class', 'colored-segments')

    for (let i = 0; i < points.length - 1; i++) {
        const colorValue = colorTarget === 'date'
            ? (points[i].date + points[i + 1].date) / 2
            : (points[i].value + points[i + 1].value) / 2
        segmentGroup.append('line')
            .attr('x1', points[i].x)
            .attr('y1', points[i].y)
            .attr('x2', points[i + 1].x)
            .attr('y2', points[i + 1].y)
            .attr('stroke', colorScale(colorValue))
            .attr('stroke-width', strokeWidth)
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0.9)
    }
}

function drawColorLegend(selection, colorScale, x, y) {
    const legendWidth = 200
    const legendHeight = 12
    const legendX = x - legendWidth / 2
    const legendY = y

    const defs = selection.select('defs').empty()
        ? selection.append('defs')
        : selection.select('defs')

    const gradientId = 'color-gradient-' + Math.random().toString(36).substr(2, 9)
    const gradient = defs.append('linearGradient')
        .attr('id', gradientId)

    const nStops = 10
    const domain = colorScale.domain()
    for (let i = 0; i <= nStops; i++) {
        const t = i / nStops
        const val = domain[0] + t * (domain[1] - domain[0])
        gradient.append('stop')
            .attr('offset', `${t * 100}%`)
            .attr('stop-color', colorScale(val))
    }

    const legendGroup = selection.append('g')
        .attr('transform', `translate(${legendX}, ${legendY})`)

    legendGroup.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .attr('fill', `url(#${gradientId})`)
        .attr('rx', 2)

    // Format label: use integer if all domain values are integers, otherwise 1 decimal
    const allIntegers = domain.every(v => Number.isInteger(v))
    const fmt = (v) => allIntegers ? String(Math.round(v)) : v.toFixed(1)

    legendGroup.append('text')
        .attr('y', legendHeight + 14)
        .attr('text-anchor', 'start')
        .text(fmt(domain[0]))
        .style('font-size', '10px')
        .style('font-family', 'sans-serif')
        .style('fill', '#666')

    legendGroup.append('text')
        .attr('x', legendWidth)
        .attr('y', legendHeight + 14)
        .attr('text-anchor', 'end')
        .text(fmt(domain[1]))
        .style('font-size', '10px')
        .style('font-family', 'sans-serif')
        .style('fill', '#666')

    const midVal = (domain[0] + domain[1]) / 2
    legendGroup.append('text')
        .attr('x', legendWidth / 2)
        .attr('y', legendHeight + 14)
        .attr('text-anchor', 'middle')
        .text(fmt(midVal))
        .style('font-size', '10px')
        .style('font-family', 'sans-serif')
        .style('fill', '#666')
}

function drawYearLabelsOnSpiral(parentGroup, data, getAngle, rScale, minYear, nCycle, fontSize, outerRadius) {
    const maxYear = d3.max(data, d => d.date.getFullYear())

    // Key principle: numAxes = nCycle
    // This guarantees every year lands exactly on an axis (no rounding, no misalignment)
    const numAxes = nCycle
    const maxYearAxisIdx = (maxYear - minYear) % nCycle

    // Draw all axis lines (thin, light)
    const axisGroup = parentGroup.append('g').attr('class', 'year-axes')
    for (let i = 0; i < numAxes; i++) {
        const angle = (i / numAxes) * 2 * Math.PI
        axisGroup.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', Math.sin(angle) * outerRadius)
            .attr('y2', -Math.cos(angle) * outerRadius)
            .attr('stroke', '#ddd')
            .attr('stroke-width', 0.5)
    }

    // Label only a subset of axes to avoid clutter
    // ~5 labeled axes, plus always the axis containing maxYear
    const labelStep = Math.max(1, Math.round(nCycle / 5))
    const newestR = outerRadius + 8
    const oldestR = outerRadius + 40

    const labelGroup = parentGroup.append('g').attr('class', 'year-labels')

    for (let i = 0; i < numAxes; i++) {
        const showLabel = (i % labelStep === 0) || (i === maxYearAxisIdx)
        if (!showLabel) continue

        const angle = (i / numAxes) * 2 * Math.PI
        const sx = Math.sin(angle)
        const sy = -Math.cos(angle)

        // Collect years on this axis
        const yearsOnAxis = []
        for (let y = minYear + i; y <= maxYear; y += nCycle) {
            yearsOnAxis.push(y)
        }
        if (yearsOnAxis.length === 0) continue

        const oldest = yearsOnAxis[0]
        const newest = yearsOnAxis[yearsOnAxis.length - 1]

        // text-anchor: right half → start, left half → end, top/bottom → middle
        const eps = 0.01
        let anchor = 'middle'
        if (sx > eps) anchor = 'start'
        else if (sx < -eps) anchor = 'end'

        // Newest year (closer to outer circle)
        labelGroup.append('text')
            .attr('x', sx * newestR)
            .attr('y', sy * newestR)
            .attr('text-anchor', anchor)
            .attr('dominant-baseline', 'central')
            .text(newest)
            .style('font-size', (fontSize || 9) + 'px')
            .style('font-family', 'sans-serif')
            .style('fill', '#999')

        // Oldest year (further out, only if different)
        if (newest !== oldest) {
            labelGroup.append('text')
                .attr('x', sx * oldestR)
                .attr('y', sy * oldestR)
                .attr('text-anchor', anchor)
                .attr('dominant-baseline', 'central')
                .text(oldest)
                .style('font-size', (fontSize || 9) + 'px')
                .style('font-family', 'sans-serif')
                .style('fill', '#bbb')
        }
    }
}

export function render(
    svgNode,
    data,
    visualOptions,
    mapping,
    originalData,
    styles
) {
    const isSeriesMapped = mapping.series && mapping.series.value

    if (isSeriesMapped) {
        renderSmallMultiples(svgNode, data, visualOptions, mapping, styles)
    } else {
        renderSingleChart(svgNode, data, visualOptions, mapping, styles)
    }
}

function renderSmallMultiples(svgNode, data, visualOptions, mapping, styles) {
    const {
        width,
        height,
        background,
        strokeWidth,

        columnsNumber,
        sortSeriesBy,
        showSeriesLabels,
    } = visualOptions

    const selection = d3.select(svgNode)
    selection.selectAll('*').remove()

    // Background
    selection
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', background)
        .lower()

    // Parse dates
    const parseDate = d3.timeParse('%Y-%m-%d')
    data.forEach((d) => {
        if (typeof d.date === 'string') {
            d.date = parseDate(d.date) || new Date(d.date)
        }
    })

    // Group by series
    const nestedData = d3.groups(data, d => d.series)

    // Calculate total value for each series (for sorting)
    nestedData.forEach(([seriesKey, seriesData]) => {
        const allValues = []
        seriesData.forEach(d => {
            Object.values(d.values).forEach(v => {
                if (v !== undefined && v !== null && !isNaN(v)) {
                    allValues.push(v)
                }
            })
        })
        seriesData.totalValue = d3.sum(allValues)
    })

    // Sort series
    const seriesSortings = {
        name: (a, b) => d3.ascending(a[0], b[0]),
        totalDescending: (a, b) => d3.descending(a[1].totalValue, b[1].totalValue),
        totalAscending: (a, b) => d3.ascending(a[1].totalValue, b[1].totalValue),
    }
    nestedData.sort(seriesSortings[sortSeriesBy] || seriesSortings.name)

    // Grid layout
    const griddingFunc = gridding()
        .size([width, height])
        .mode('grid')
        .padding(10)
        .cols(columnsNumber)

    const griddingData = griddingFunc(nestedData)

    // Create viz layer
    const svg = selection.append('g').attr('id', 'viz')

    // Draw each series group
    const seriesGroups = svg
        .selectAll('g.series-group')
        .data(griddingData)
        .join('g')
        .attr('class', 'series-group')
        .attr('transform', d => `translate(${d.x},${d.y})`)

    seriesGroups.each(function (d) {
        const seriesKey = d[0]
        const seriesData = d[1]
        const seriesWidth = d.width
        const seriesHeight = d.height

        renderSpiralInGroup(
            d3.select(this),
            seriesData,
            seriesWidth,
            seriesHeight,
            mapping,
            visualOptions,
            seriesKey,
            showSeriesLabels,
            strokeWidth
        )
    })
}

function renderSpiralInGroup(
    groupSelection,
    data,
    width,
    height,
    mapping,
    visualOptions,
    seriesKey,
    showSeriesLabels,
    strokeWidth
) {
    const { maxRadius, colorTarget, colorScheme, symmetricDomain, yearsPerCycle } = visualOptions
    const hasColoring = colorTarget && colorTarget !== 'none'
    const margin = { top: 30, right: 20, bottom: 20, left: 20 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom
    const radius = Math.min(chartWidth, chartHeight, maxRadius) / 2

    // Center the chart
    const chartGroup = groupSelection
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`)

    // Series title
    if (showSeriesLabels) {
        groupSelection
            .append('text')
            .attr('x', width / 2)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .text(seriesKey)
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('font-family', 'sans-serif')
    }

    // Sort by date
    data.sort((a, b) => a.date - b.date)

    // Detect time unit and build angle function
    const timeUnit = detectTimeUnit(data)
    const minYear = d3.min(data, d => d.date.getFullYear())
    const nCycle = yearsPerCycle || 10

    // Cumulative angle: for year mode, angle increases continuously (spiral)
    const getAngle = timeUnit === 'year'
        ? (d) => (d.date.getFullYear() - minYear) / nCycle * 2 * Math.PI
        : (d) => {
            const startOfYear = new Date(d.date.getFullYear(), 0, 1)
            const dayOfYear = (d.date - startOfYear) / 86400000
            return (dayOfYear / 366) * 2 * Math.PI
        }

    // Radius scale
    const allValues = []
    data.forEach(d => {
        Object.values(d.values).forEach(v => {
            if (v !== undefined && v !== null && !isNaN(v)) {
                allValues.push(v)
            }
        })
    })
    const extent = d3.extent(allValues)
    if (typeof extent[0] === 'undefined') return

    const rScale = d3.scaleLinear()
        .domain(extent)
        .range([radius * 0.1, radius])

    // Color scale for multiple values
    const valueKeys = Object.keys(data[0].values)
    const color = d3.scaleOrdinal()
        .domain(valueKeys)
        .range(d3.schemeCategory10)

    // Draw paths
    if (hasColoring) {
        let cScale
        if (colorTarget === 'date') {
            const dateExtent = d3.extent(data, d => d.date.getTime())
            cScale = d3.scaleSequential(d3[colorScheme] || d3.interpolateBlues).domain(dateExtent)
        } else {
            cScale = buildValueColorScale(allValues, colorScheme, symmetricDomain)
        }

        valueKeys.forEach((key) => {
            const validPoints = data.filter(d => d.values[key] !== undefined && d.values[key] !== null)
            if (validPoints.length < 2) return
            validPoints.sort((a, b) => a.date - b.date)
            drawColoredSegments(chartGroup, validPoints, getAngle, rScale, key, cScale, strokeWidth, colorTarget)
        })
    } else {
        valueKeys.forEach((key, i) => {
            const lineGenerator = d3.lineRadial()
                .angle(d => getAngle(d))
                .radius(d => {
                    const v = d.values[key]
                    return (v !== undefined && v !== null && !isNaN(v)) ? rScale(v) : 0
                })
                .curve(d3.curveCatmullRom)

            const validPoints = data.filter(d => d.values[key] !== undefined && d.values[key] !== null)
            if (validPoints.length < 2) return

            validPoints.sort((a, b) => a.date - b.date)

            chartGroup.append('path')
                .datum(validPoints)
                .attr('d', lineGenerator)
                .attr('stroke', color(key))
                .attr('stroke-width', strokeWidth)
                .attr('fill', 'none')
                .attr('opacity', 0.8)
        })
    }

    // Axis circles
    const ticks = rScale.ticks(3)
    chartGroup.append('g')
        .selectAll('circle')
        .data(ticks)
        .enter()
        .append('circle')
        .attr('r', d => rScale(d))
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-dasharray', '3,3')

    chartGroup.append('g')
        .selectAll('text')
        .data(ticks)
        .enter()
        .append('text')
        .attr('y', d => -rScale(d))
        .attr('dy', '-0.4em')
        .attr('text-anchor', 'middle')
        .text(d => d)
        .style('font-size', '8px')
        .style('fill', '#999')

    // Angle axis lines and labels
    if (timeUnit === 'year') {
        drawYearLabelsOnSpiral(chartGroup, data, getAngle, rScale, minYear, nCycle, 8, radius)
    } else {
        const months = ['Jan', 'Apr', 'Jul', 'Oct']
        const axisAngles = [0, 3, 6, 9].map(i => (i / 12) * 2 * Math.PI)

        chartGroup.append('g')
            .selectAll('line')
            .data(axisAngles)
            .enter()
            .append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', d => Math.sin(d) * radius)
            .attr('y2', d => -Math.cos(d) * radius)
            .attr('stroke', '#eee')

        chartGroup.append('g')
            .selectAll('text')
            .data(months)
            .enter()
            .append('text')
            .attr('x', (d, i) => Math.sin(axisAngles[i]) * (radius + 10))
            .attr('y', (d, i) => -Math.cos(axisAngles[i]) * (radius + 10))
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .text(d => d)
            .style('font-size', '10px')
            .style('font-family', 'sans-serif')
    }
}

function renderSingleChart(svgNode, data, visualOptions, mapping, styles) {
    const {
        width,
        height,
        background,
        maxRadius,
        strokeWidth,
        colorTarget,
        colorScheme,
        symmetricDomain,
        yearsPerCycle,
    } = visualOptions
    const hasColoring = colorTarget && colorTarget !== 'none'

    const margin = { top: 50, right: 50, bottom: 50, left: 50 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom
    const radius = Math.min(chartWidth, chartHeight, maxRadius) / 2

    const selection = d3.select(svgNode)
    selection.selectAll('*').remove()

    const svg = selection
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`)

    selection
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('x', 0)
        .attr('y', 0)
        .attr('fill', background)
        .lower()

    const parseDate = d3.timeParse('%Y-%m-%d')

    data.forEach((d) => {
        if (typeof d.date === 'string') {
            d.date = parseDate(d.date) || new Date(d.date)
        }
        d.value = +d.value
    })

    data.sort((a, b) => a.date - b.date)

    // Detect time unit and build angle function
    const timeUnit = detectTimeUnit(data)
    const minYear = d3.min(data, d => d.date.getFullYear())
    const nCycle = yearsPerCycle || 10

    // Cumulative angle: for year mode, angle increases continuously (spiral)
    const getAngle = timeUnit === 'year'
        ? (d) => (d.date.getFullYear() - minYear) / nCycle * 2 * Math.PI
        : (d) => {
            const startOfYear = new Date(d.date.getFullYear(), 0, 1)
            const dayOfYear = (d.date - startOfYear) / 86400000
            return (dayOfYear / 366) * 2 * Math.PI
        }

    const allValues = []
    data.forEach(d => {
        Object.values(d.values).forEach(v => {
            if (v !== undefined && v !== null && !isNaN(v)) {
                allValues.push(v)
            }
        })
    })
    const extent = d3.extent(allValues)

    if (typeof extent[0] === 'undefined') return

    const rScale = d3.scaleLinear()
        .domain(extent)
        .range([radius * 0.1, radius])

    let color = () => '#666'
    const valueKeys = Object.keys(data[0].values)
    const isMultiValue = valueKeys.length > 1
    const isSeriesMapped = mapping.series && mapping.series.value

    if (isSeriesMapped) {
        const seriesDomain = [...new Set(data.map(d => d.series))]
        color = d3.scaleOrdinal()
            .domain(seriesDomain)
            .range(d3.schemeCategory10)
    } else if (isMultiValue) {
        color = d3.scaleOrdinal()
            .domain(valueKeys)
            .range(d3.schemeCategory10)
    }

    const drawPath = (data, valueKey, seriesKey, colorVal, isDashed) => {
        const lineGenerator = d3.lineRadial()
            .angle(d => getAngle(d))
            .radius(d => {
                const v = d.values[valueKey]
                return (v !== undefined && v !== null && !isNaN(v)) ? rScale(v) : 0
            })
            .curve(d3.curveCatmullRom)

        const validPoints = data.filter(d => d.values[valueKey] !== undefined && d.values[valueKey] !== null)
        if (validPoints.length < 2) return

        validPoints.sort((a, b) => a.date - b.date)

        svg.append('path')
            .datum(validPoints)
            .attr('d', lineGenerator)
            .attr('stroke', colorVal)
            .attr('stroke-width', strokeWidth)
            .attr('fill', 'none')
            .attr('opacity', 0.8)
    }

    if (hasColoring) {
        let cScale
        if (colorTarget === 'date') {
            const dateExtent = d3.extent(data, d => d.date.getTime())
            cScale = d3.scaleSequential(d3[colorScheme] || d3.interpolateBlues).domain(dateExtent)
        } else {
            cScale = buildValueColorScale(allValues, colorScheme, symmetricDomain)
        }

        if (isSeriesMapped) {
            const nestedData = d3.groups(data, d => d.series)
            nestedData.forEach(([seriesKey, seriesData]) => {
                valueKeys.forEach((key) => {
                    const validPoints = seriesData.filter(d => d.values[key] !== undefined && d.values[key] !== null)
                    if (validPoints.length < 2) return
                    validPoints.sort((a, b) => a.date - b.date)
                    drawColoredSegments(svg, validPoints, getAngle, rScale, key, cScale, strokeWidth, colorTarget)
                })
            })
        } else {
            valueKeys.forEach((key) => {
                const validPoints = data.filter(d => d.values[key] !== undefined && d.values[key] !== null)
                if (validPoints.length < 2) return
                validPoints.sort((a, b) => a.date - b.date)
                drawColoredSegments(svg, validPoints, getAngle, rScale, key, cScale, strokeWidth, colorTarget)
            })
        }

        // Legend: for date mode show years, for value mode show numbers
        if (colorTarget === 'date') {
            const dateExtent = d3.extent(data, d => d.date.getTime())
            const yearMin = new Date(dateExtent[0]).getFullYear()
            const yearMax = new Date(dateExtent[1]).getFullYear()
            // Create a year-labeled scale for legend
            const legendScale = d3.scaleSequential(d3[colorScheme] || d3.interpolateBlues)
                .domain([yearMin, yearMax])
            drawColorLegend(selection, legendScale, width / 2, height - 60)
        } else {
            drawColorLegend(selection, cScale, width / 2, height - 60)
        }
    } else if (isSeriesMapped) {
        const nestedData = d3.groups(data, d => d.series)

        nestedData.forEach(([seriesKey, seriesData]) => {
            valueKeys.forEach((key, i) => {
                const colorVal = color(seriesKey)
                const isDashed = i > 0

                drawPath(seriesData, key, seriesKey, colorVal, isDashed)
            })
        })
    } else {
        valueKeys.forEach((key) => {
            const colorVal = isMultiValue ? color(key) : 'steelblue'
            drawPath(data, key, null, colorVal, false)
        })
    }

    const ticks = rScale.ticks(5)
    svg.append('g')
        .attr('class', 'r-axis')
        .selectAll('circle')
        .data(ticks)
        .enter()
        .append('circle')
        .attr('r', d => rScale(d))
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-dasharray', '3,3')

    svg.append('g')
        .selectAll('text')
        .data(ticks)
        .enter()
        .append('text')
        .attr('y', d => -rScale(d))
        .attr('dy', '-0.4em')
        .attr('text-anchor', 'middle')
        .text(d => d)
        .style('font-size', '10px')
        .style('fill', '#999')

    // Angle axis lines and labels
    if (timeUnit === 'year') {
        drawYearLabelsOnSpiral(svg, data, getAngle, rScale, minYear, nCycle, 10, radius)
    } else {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
        const axisAngles = months.map((_, i) => (i / 12) * 2 * Math.PI)

        svg.append('g')
            .attr('class', 'a-axis')
            .selectAll('line')
            .data(axisAngles)
            .enter()
            .append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', d => Math.sin(d) * radius)
            .attr('y2', d => -Math.cos(d) * radius)
            .attr('stroke', '#eee')

        svg.append('g')
            .selectAll('text')
            .data(months)
            .enter()
            .append('text')
            .attr('x', (d, i) => Math.sin(axisAngles[i]) * (radius + 20))
            .attr('y', (d, i) => -Math.cos(axisAngles[i]) * (radius + 20))
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .text(d => d)
            .style('font-size', '12px')
            .style('font-family', 'sans-serif')
    }
}
