import render from './render'

const SVG_NS = 'http://www.w3.org/2000/svg'

const baseOptions = {
    width: 500,
    height: 300,
    background: '#ffffff',
    marginTop: 20,
    marginRight: 50,
    marginBottom: 30,
    marginLeft: 50,
    padding: 2,
    maxCategories: 0,
    othersLabel: 'Others',
    xAxisLabelRotation: '0',
    showDots: true,
    showThreshold: true,
    threshold: 80,
    showValueLabels: false,
    labelFontSize: 10,
    valueAxisTitle: '',
    cumulativeAxisTitle: 'Cumulative %',
    barColor: '#5b8db8',
    lineColor: '#d1605e',
}

const mapping = {
    category: { value: 'cause' },
    value: { value: 'count', config: { aggregation: 'sum' } },
}

const data = [
    { category: 'A', value: 50 },
    { category: 'B', value: 30 },
    { category: 'C', value: 15 },
    { category: 'D', value: 5 },
]

function draw(opts = {}, chartData = data, chartMapping = mapping) {
    const svg = document.createElementNS(SVG_NS, 'svg')
    render(svg, chartData, { ...baseOptions, ...opts }, chartMapping, [], {})
    return svg
}

describe('Pareto chart render', () => {
    test('draws the background first, then the viz group', () => {
        const svg = draw()
        const [first, second] = svg.children
        expect(first.id).toBe('background')
        expect(first.tagName).toBe('rect')
        expect(first.getAttribute('fill')).toBe('#ffffff')
        expect(first.getAttribute('width')).toBe('500')
        expect(first.getAttribute('height')).toBe('300')
        expect(second.id).toBe('viz')
        expect(second.tagName).toBe('g')
        expect(second.getAttribute('transform')).toBe('translate(50,20)')
    })

    test('draws one bar per item with the bar color', () => {
        const svg = draw()
        const bars = svg.querySelectorAll('rect.bar')
        expect(bars).toHaveLength(4)
        bars.forEach((b) => expect(b.getAttribute('fill')).toBe('#5b8db8'))
        // heights follow the values (descending)
        const heights = Array.from(bars).map((b) => Number(b.getAttribute('height')))
        expect(heights[0]).toBeGreaterThan(heights[1])
        expect(heights[1]).toBeGreaterThan(heights[2])
        expect(heights[2]).toBeGreaterThan(heights[3])
    })

    test('the tallest bar reaches the top of the nice value axis', () => {
        const svg = draw()
        const bars = svg.querySelectorAll('rect.bar')
        // values go 0..50, nice() keeps 50, chart height is 300-20-30
        expect(Number(bars[0].getAttribute('y'))).toBeCloseTo(0)
        expect(Number(bars[0].getAttribute('height'))).toBeCloseTo(250)
    })

    test('draws the cumulative line through the centers of the bars', () => {
        const svg = draw()
        const paths = svg.querySelectorAll('path.cumulative-line')
        expect(paths).toHaveLength(1)
        expect(paths[0].getAttribute('stroke')).toBe('#d1605e')
        expect(paths[0].getAttribute('fill')).toBe('none')

        const bars = svg.querySelectorAll('rect.bar')
        const dots = svg.querySelectorAll('circle.dot')
        expect(dots).toHaveLength(4)
        bars.forEach((bar, i) => {
            const center =
                Number(bar.getAttribute('x')) +
                Number(bar.getAttribute('width')) / 2
            expect(Number(dots[i].getAttribute('cx'))).toBeCloseTo(center)
        })
        // path starts at the first dot
        const d = paths[0].getAttribute('d')
        expect(d.startsWith('M')).toBe(true)
        expect(d.match(/[ML]/g)).toHaveLength(4)
        // cumulative 100% is at the top of the chart (y = 0)
        expect(Number(dots[3].getAttribute('cy'))).toBeCloseTo(0)
        // cumulative 50% is at half of the chart height (250)
        expect(Number(dots[0].getAttribute('cy'))).toBeCloseTo(125)
    })

    test('hides the dots when showDots is false', () => {
        const svg = draw({ showDots: false })
        expect(svg.querySelectorAll('circle.dot')).toHaveLength(0)
        expect(svg.querySelectorAll('path.cumulative-line')).toHaveLength(1)
    })

    test('draws a dashed threshold line at the given percentage', () => {
        const svg = draw({ threshold: 80 })
        const line = svg.querySelector('line.threshold')
        expect(line).not.toBeNull()
        expect(line.getAttribute('stroke-dasharray')).toBeTruthy()
        expect(Number(line.getAttribute('y1'))).toBeCloseTo(50)
        expect(line.getAttribute('y1')).toBe(line.getAttribute('y2'))
        expect(Number(line.getAttribute('x1'))).toBe(0)
        expect(Number(line.getAttribute('x2'))).toBe(400)
    })

    test('omits the threshold line when showThreshold is false', () => {
        const svg = draw({ showThreshold: false })
        expect(svg.querySelector('line.threshold')).toBeNull()
    })

    test('draws the left, right and bottom axes', () => {
        const svg = draw()
        expect(svg.querySelector('#yAxis')).not.toBeNull()
        expect(svg.querySelector('#xAxis')).not.toBeNull()

        const right = svg.querySelector('#yAxisRight')
        expect(right.getAttribute('transform')).toBe('translate(400,0)')
        const rightTicks = Array.from(right.querySelectorAll('.tick text')).map(
            (t) => t.textContent
        )
        expect(rightTicks[0]).toBe('0%')
        expect(rightTicks[rightTicks.length - 1]).toBe('100%')

        const xLabels = Array.from(
            svg.querySelectorAll('#xAxis .tick text')
        ).map((t) => t.textContent)
        expect(xLabels).toEqual(['A', 'B', 'C', 'D'])
        // tickSizeOuter(0): the domain path has no outer ticks (no V segment)
        expect(svg.querySelector('#xAxis .domain').getAttribute('d')).toMatch(
            /^M[\d.]+,[\d.]+H[\d.]+$/
        )
    })

    test('shows axis titles in Arial 10', () => {
        const svg = draw()
        const titles = Array.from(svg.querySelectorAll('#viz > g > text'))
        expect(titles.map((t) => t.textContent)).toEqual([
            'count [sum]',
            'Cumulative %',
            'cause',
        ])
        titles.forEach((t) => {
            expect(t.getAttribute('font-family')).toBe('Arial, sans-serif')
            expect(t.getAttribute('font-size')).toBe('10')
        })
    })

    test('titles the value axis "Count" when the value is not mapped', () => {
        const svg = draw({}, data, {
            category: { value: 'cause' },
            value: { value: undefined },
        })
        expect(svg.querySelector('#yAxis > text').textContent).toBe('Count')
    })

    test('uses the axis titles given in the options', () => {
        const svg = draw({ valueAxisTitle: '件数', cumulativeAxisTitle: '累積比率' })
        const titles = Array.from(svg.querySelectorAll('#viz > g > text'))
        expect(titles.map((t) => t.textContent)).toEqual([
            '件数',
            '累積比率',
            'cause',
        ])
    })

    test('shows cumulative percentage labels only when asked', () => {
        expect(draw().querySelectorAll('text.value-label')).toHaveLength(0)
        const svg = draw({ showValueLabels: true, labelFontSize: 12 })
        const labels = Array.from(svg.querySelectorAll('text.value-label'))
        expect(labels.map((t) => t.textContent)).toEqual([
            '50.0%',
            '80.0%',
            '95.0%',
            '100.0%',
        ])
        expect(labels[0].getAttribute('font-size')).toBe('12')
    })

    test('merges the tail into the Others item when maxCategories is set', () => {
        const svg = draw({ maxCategories: 2, othersLabel: 'Rest' })
        expect(svg.querySelectorAll('rect.bar')).toHaveLength(3)
        expect(svg.querySelectorAll('circle.dot')).toHaveLength(3)
        const xLabels = Array.from(
            svg.querySelectorAll('#xAxis .tick text')
        ).map((t) => t.textContent)
        expect(xLabels).toEqual(['A', 'B', 'Rest'])
    })

    test('keeps distinct bars when a label is duplicated', () => {
        const svg = draw(
            { maxCategories: 1, othersLabel: 'A' },
            data
        )
        expect(svg.querySelectorAll('rect.bar')).toHaveLength(2)
    })

    test('rotates the x axis labels', () => {
        const svg = draw({ xAxisLabelRotation: '45' })
        const text = svg.querySelector('#xAxis .tick text')
        expect(text.getAttribute('transform')).toBe('rotate(-45)')
        expect(text.getAttribute('text-anchor')).toBe('end')
    })

    test('converts the padding from px to the band ratio', () => {
        const svg = draw({ padding: 0 })
        const bars = svg.querySelectorAll('rect.bar')
        // 400px / 4 bars, no padding
        expect(Number(bars[0].getAttribute('width'))).toBeCloseTo(100)
        const spaced = draw({ padding: 10 }).querySelectorAll('rect.bar')
        expect(Number(spaced[0].getAttribute('width'))).toBeLessThan(100)
    })

    test('draws only the background for empty data', () => {
        const svg = draw({}, [])
        expect(svg.children).toHaveLength(1)
        expect(svg.children[0].id).toBe('background')
    })

    test('redraws from scratch on a second call', () => {
        const svg = draw()
        render(svg, data, baseOptions, mapping, [], {})
        expect(svg.querySelectorAll('#background')).toHaveLength(1)
        expect(svg.querySelectorAll('rect.bar')).toHaveLength(4)
    })

    test('throws a readable error when the total is not positive', () => {
        expect(() => draw({}, [{ category: 'A', value: 0 }])).toThrow(
            /greater than 0/
        )
    })

    test('throws when the padding leaves no room for bars', () => {
        expect(() => draw({ padding: 200 })).toThrow(/Padding is too high/)
    })

    test('throws when the margins leave no room for the chart', () => {
        expect(() => draw({ marginLeft: 400, marginRight: 400 })).toThrow(
            /Margins are too large/
        )
    })
})
