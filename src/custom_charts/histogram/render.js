import * as d3 from 'd3'

export function render(
    node,
    data,
    visualOptions,
    mapping,
    originalData,
    styles
) {
    const { width, height } = node.getBoundingClientRect()
    const { marginTop, marginRight, marginBottom, marginLeft, color, bins, padding } = visualOptions



    // Select the SVG element
    const svg = d3.select(node).append('svg')
        .attr('width', width)
        .attr('height', height)

    // define the chart area
    const drawingArea = svg.append('g')
        .attr('transform', `translate(${marginLeft},${marginTop})`)

    const chartWidth = width - marginLeft - marginRight
    const chartHeight = height - marginTop - marginBottom

    // Create scales
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.value))
        .nice()
        .range([0, chartWidth])

    // Create bins
    const [min, max] = x.domain()
    const thresholds = d3.range(bins + 1).map(i => min + (max - min) * i / bins)

    const binGenerator = d3.bin()
        .domain(x.domain())
        .thresholds(thresholds)
        .value(d => d.value)

    const buckets = binGenerator(data)

    const y = d3.scaleLinear()
        .domain([0, d3.max(buckets, d => d.length)])
        .nice()
        .range([chartHeight, 0])

    // Draw bars
    drawingArea.selectAll('rect')
        .data(buckets)
        .join('rect')
        .attr('x', d => x(d.x0) + padding / 2)
        .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - padding))
        .attr('y', d => y(d.length))
        .attr('height', d => y(0) - y(d.length))
        .attr('fill', color) // Use the color from visualOptions

    // Add axes
    const xAxis = d3.axisBottom(x)
    const yAxis = d3.axisLeft(y)

    drawingArea.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(xAxis)

    drawingArea.append('g')
        .call(yAxis)
}

