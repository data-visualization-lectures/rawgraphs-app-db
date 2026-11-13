import render from './render'
import { scaleOrdinal } from 'd3'

const SVG_NS = 'http://www.w3.org/2000/svg'

const baseOptions = {
    width: 500,
    height: 400,
    background: '#ffffff',
    marginTop: 40,
    marginRight: 40,
    marginBottom: 40,
    marginLeft: 40,
    showLegend: false,
    legendWidth: 200,
    encoding: 'area',
    innerRadius: 0,
    padAngle: 1,
    startAngle: 0,
    sortBy: 'original',
    showRings: true,
    showLabels: true,
    showValueLabels: false,
    labelFontSize: 10,
    colorScale: scaleOrdinal()
        .domain(['A', 'B', 'C', 'D'])
        .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3']),
}

const mapping = {
    category: { value: 'month' },
    value: { value: 'visitors', config: { aggregation: 'sum' } },
}

const data = [
    { category: 'A', value: 100 },
    { category: 'B', value: 25 },
    { category: 'C', value: 0 },
    { category: 'D', value: 50 },
]

function draw(opts = {}, chartData = data, chartMapping = mapping) {
    const svg = document.createElementNS(SVG_NS, 'svg')
    render(svg, chartData, { ...baseOptions, ...opts }, chartMapping, [], {})
    return svg
}

// the chart area is 420 x 320: the outer radius is 160
const OUTER = 160

// distance from the center of the farthest end point of the M / L / A commands of a path
function farthestPoint(path) {
    const commands = path.getAttribute('d').match(/[MLA][^MLAZ]*/g)
    return Math.max(
        ...commands.map((c) => {
            const values = c.slice(1).match(/-?\d+(\.\d+)?(e-?\d+)?/g)
            const [x, y] = values.slice(-2).map(Number)
            return Math.hypot(x, y)
        })
    )
}

// jsdom cannot measure text, which the legend needs
beforeAll(() => {
    window.SVGElement.prototype.getComputedTextLength = () => 50
    window.SVGElement.prototype.getBBox = () => ({
        x: 0,
        y: 0,
        width: 50,
        height: 12,
    })
})
afterAll(() => {
    delete window.SVGElement.prototype.getComputedTextLength
    delete window.SVGElement.prototype.getBBox
})

describe('Polar area chart render', () => {
    test('draws the background first, then the viz group at the center', () => {
        const svg = draw()
        const [first, second] = svg.children
        expect(first.id).toBe('background')
        expect(first.tagName).toBe('rect')
        expect(first.getAttribute('fill')).toBe('#ffffff')
        expect(first.getAttribute('width')).toBe('500')
        expect(first.getAttribute('height')).toBe('400')
        expect(second.id).toBe('viz')
        expect(second.tagName).toBe('g')
        // margin + half of the chart area
        expect(second.getAttribute('transform')).toBe('translate(250,200)')
    })

    test('the background includes the legend width when the legend is shown', () => {
        const svg = draw({ showLegend: true, legendWidth: 150 })
        expect(svg.querySelector('#background').getAttribute('width')).toBe('650')
        expect(svg.getAttribute('width')).toBe('650')
        expect(draw().querySelector('#background').getAttribute('width')).toBe(
            '500'
        )
    })

    test('draws one sector per item, filled by the color scale', () => {
        const svg = draw()
        const sectors = svg.querySelectorAll('path.sector')
        expect(sectors).toHaveLength(4)
        expect(
            Array.from(sectors).map((s) => s.getAttribute('fill'))
        ).toEqual(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3'])
    })

    test('gives each sector a title with the category and the value', () => {
        const svg = draw()
        const titles = Array.from(
            svg.querySelectorAll('path.sector > title')
        ).map((t) => t.textContent)
        expect(titles).toEqual(['A: 100', 'B: 25', 'C: 0', 'D: 50'])
    })

    test('the largest sector reaches the outer radius, the others follow the area', () => {
        const svg = draw({ padAngle: 0, showRings: false })
        const [a, b, , d] = svg.querySelectorAll('path.sector')
        expect(farthestPoint(a)).toBeCloseTo(OUTER, 1)
        expect(farthestPoint(b)).toBeCloseTo(OUTER * Math.sqrt(0.25), 1)
        expect(farthestPoint(d)).toBeCloseTo(OUTER * Math.sqrt(0.5), 1)
    })

    test('the radius encoding makes the radius proportional to the value', () => {
        const svg = draw({
            padAngle: 0,
            showRings: false,
            encoding: 'radius',
        })
        const [a, b, , d] = svg.querySelectorAll('path.sector')
        expect(farthestPoint(a)).toBeCloseTo(OUTER, 1)
        expect(farthestPoint(b)).toBeCloseTo(OUTER * 0.25, 1)
        expect(farthestPoint(d)).toBeCloseTo(OUTER * 0.5, 1)
    })

    test('the sectors start at the top, clockwise, with equal angles', () => {
        const svg = draw({ padAngle: 0, showRings: false }, [
            { category: 'A', value: 10 },
            { category: 'B', value: 10 },
            { category: 'C', value: 10 },
            { category: 'D', value: 10 },
        ])
        // the first quarter goes from the top (0,-r) to the right (r,0)
        const d = svg.querySelector('path.sector').getAttribute('d')
        const [startX, startY] = d.match(/^M(-?[\d.e-]+),(-?[\d.e-]+)/).slice(1).map(Number)
        expect(startX).toBeCloseTo(0, 5)
        expect(startY).toBeCloseTo(-OUTER, 5)
        const [endX, endY] = d.match(/A[^L]*?(-?[\d.e-]+),(-?[\d.e-]+)L/).slice(1).map(Number)
        expect(endX).toBeCloseTo(OUTER, 5)
        expect(endY).toBeCloseTo(0, 5)
    })

    test('the start angle turns the chart clockwise', () => {
        const equal = [
            { category: 'A', value: 10 },
            { category: 'B', value: 10 },
        ]
        const svg = draw({ padAngle: 0, showRings: false, startAngle: 90 }, equal)
        const d = svg.querySelector('path.sector').getAttribute('d')
        const [startX, startY] = d.match(/^M(-?[\d.e-]+),(-?[\d.e-]+)/).slice(1).map(Number)
        expect(startX).toBeCloseTo(OUTER, 5)
        expect(startY).toBeCloseTo(0, 5)
    })

    test('the gap between sectors changes the shape of the sectors', () => {
        const noGap = draw({ padAngle: 0 }).querySelector('path.sector')
        const gap = draw({ padAngle: 5 }).querySelector('path.sector')
        expect(gap.getAttribute('d')).not.toBe(noGap.getAttribute('d'))
    })

    test('the inner radius leaves a hole in the middle', () => {
        const svg = draw({ innerRadius: 40, padAngle: 0, showRings: false })
        const [a, , c] = svg.querySelectorAll('path.sector')
        // an annular sector ends with an arc back to the inner circle
        expect(a.getAttribute('d')).toMatch(/A40,40,/)
        // a value of 0 stays on the inner circle
        expect(farthestPoint(c)).toBeCloseTo(40, 1)
    })

    test('draws the rings below the sectors, with values at the top', () => {
        const svg = draw()
        const viz = svg.querySelector('#viz')
        const ids = Array.from(viz.children).map((g) => g.id)
        expect(ids.indexOf('rings')).toBeLessThan(ids.indexOf('sectors'))

        // ticks of 0..100: 20, 40, 60, 80, 100 (the 0 ring is not drawn)
        const rings = Array.from(svg.querySelectorAll('circle.ring'))
        const labels = Array.from(svg.querySelectorAll('text.ring-label'))
        expect(labels.map((t) => t.textContent)).toEqual(
            rings.map((c, i) => ['20', '40', '60', '80', '100'][i])
        )
        expect(labels).toHaveLength(5)
        rings.forEach((c, i) => {
            const share = [20, 40, 60, 80, 100][i] / 100
            // area encoding
            expect(Number(c.getAttribute('r'))).toBeCloseTo(
                OUTER * Math.sqrt(share),
                5
            )
            // the value is just above its ring, at the top
            expect(labels[i].getAttribute('x')).toBe('0')
            expect(Number(labels[i].getAttribute('y'))).toBeLessThan(
                -Number(c.getAttribute('r')) + 0.001
            )
        })
    })

    test('the rings follow the encoding and the inner radius', () => {
        const svg = draw({ encoding: 'radius', innerRadius: 40 })
        const radii = Array.from(svg.querySelectorAll('circle.ring')).map((c) =>
            Number(c.getAttribute('r'))
        )
        expect(radii[0]).toBeCloseTo(40 + (OUTER - 40) * 0.2, 5)
        expect(radii[radii.length - 1]).toBeCloseTo(OUTER, 5)
    })

    test('hides the rings when showRings is false', () => {
        const svg = draw({ showRings: false })
        expect(svg.querySelector('#rings')).toBeNull()
        expect(svg.querySelectorAll('circle.ring')).toHaveLength(0)
        expect(svg.querySelectorAll('text.ring-label')).toHaveLength(0)
    })

    test('shows the category labels outside the circle, in Arial', () => {
        const svg = draw({ labelFontSize: 12 })
        const labels = Array.from(svg.querySelectorAll('text.label'))
        expect(labels.map((t) => t.textContent)).toEqual(['A', 'B', 'C', 'D'])
        labels.forEach((t) => {
            expect(t.getAttribute('font-family')).toBe('Arial, sans-serif')
            expect(t.getAttribute('font-size')).toBe('12')
            expect(
                Math.hypot(Number(t.getAttribute('x')), Number(t.getAttribute('y')))
            ).toBeGreaterThan(OUTER)
        })
    })

    test('switches the text anchor between the right and the left side', () => {
        const svg = draw()
        const anchors = Array.from(svg.querySelectorAll('text.label')).map(
            (t) => t.getAttribute('text-anchor')
        )
        // centers at 45, 135, 225 and 315 degrees
        expect(anchors).toEqual(['start', 'start', 'end', 'end'])
    })

    test('centers the label that is at the top or at the bottom', () => {
        // two sectors of 180 degrees: their centers are at 0 (top) and 180 (bottom) degrees
        // when the chart starts at -90 degrees
        const svg = draw({ startAngle: -90 }, [
            { category: 'A', value: 1 },
            { category: 'B', value: 1 },
        ])
        const labels = Array.from(svg.querySelectorAll('text.label'))
        expect(labels.map((t) => t.getAttribute('text-anchor'))).toEqual([
            'middle',
            'middle',
        ])
        expect(Number(labels[0].getAttribute('y'))).toBeLessThan(0)
        expect(Number(labels[1].getAttribute('y'))).toBeGreaterThan(0)
        // the text is above the circle at the top and below it at the bottom
        expect(parseFloat(labels[0].getAttribute('dy'))).toBeCloseTo(0)
        expect(parseFloat(labels[1].getAttribute('dy'))).toBeGreaterThan(0.5)
    })

    test('hides the category labels when showLabels is false', () => {
        const svg = draw({ showLabels: false })
        expect(svg.querySelectorAll('text.label')).toHaveLength(0)
    })

    test('shows value labels only when asked, not for a zero-length sector', () => {
        expect(draw().querySelectorAll('text.value-label')).toHaveLength(0)
        const svg = draw({ showValueLabels: true })
        const labels = Array.from(svg.querySelectorAll('text.value-label'))
        expect(labels.map((t) => t.textContent)).toEqual(['100', '25', '50'])
    })

    test('sorts the sectors', () => {
        const titles = (opts) =>
            Array.from(
                draw(opts).querySelectorAll('path.sector > title')
            ).map((t) => t.textContent.split(':')[0])
        expect(titles({ sortBy: 'original' })).toEqual(['A', 'B', 'C', 'D'])
        expect(titles({ sortBy: 'totalDescending' })).toEqual(['A', 'D', 'B', 'C'])
        expect(titles({ sortBy: 'totalAscending' })).toEqual(['C', 'B', 'D', 'A'])
        expect(titles({ sortBy: 'name' })).toEqual(['A', 'B', 'C', 'D'])
    })

    test('draws the legend with the color scale when asked', () => {
        expect(draw().querySelector('#legend')).toBeNull()
        const svg = draw({ showLegend: true })
        const legend = svg.querySelector('#legend')
        expect(legend).not.toBeNull()
        expect(legend.getAttribute('transform')).toBe('translate(500,40)')
        expect(legend.textContent).toContain('month')
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
        expect(svg.querySelectorAll('path.sector')).toHaveLength(4)
    })

    test('draws a single item as a full circle', () => {
        const svg = draw({}, [{ category: 'A', value: 5 }])
        expect(svg.querySelectorAll('path.sector')).toHaveLength(1)
    })

    test('draws sectors when every value is 0', () => {
        const svg = draw({}, [
            { category: 'A', value: 0 },
            { category: 'B', value: 0 },
        ])
        expect(svg.querySelectorAll('path.sector')).toHaveLength(2)
        expect(svg.querySelectorAll('circle.ring')).toHaveLength(0)
        expect(svg.innerHTML).not.toContain('NaN')
    })

    test('treats an empty value (null) as 0', () => {
        const svg = draw({}, [
            { category: 'A', value: 4 },
            { category: 'B', value: null },
        ])
        const titles = Array.from(svg.querySelectorAll('path.sector > title'))
        expect(titles.map((t) => t.textContent)).toEqual(['A: 4', 'B: 0'])
    })

    test('throws a readable error for negative values', () => {
        expect(() => draw({}, [{ category: 'A', value: -1 }])).toThrow(/negative/)
    })

    test('throws a readable error for values that are not numbers', () => {
        expect(() => draw({}, [{ category: 'A', value: 'x' }])).toThrow(
            /only numbers/
        )
    })

    test('throws when the margins leave no room for the chart', () => {
        expect(() => draw({ marginLeft: 400, marginRight: 400 })).toThrow(
            /Margins are too large/
        )
        expect(() => draw({ marginTop: 200, marginBottom: 200 })).toThrow(
            /Margins are too large/
        )
    })

    test('throws when the inner radius is not smaller than the outer radius', () => {
        expect(() => draw({ innerRadius: 160 })).toThrow(/Inner radius/)
        expect(() => draw({ innerRadius: 300 })).toThrow(/Inner radius/)
        expect(() => draw({ innerRadius: 159 })).not.toThrow()
    })

    test('throws when the inner radius is negative', () => {
        expect(() => draw({ innerRadius: -1 })).toThrow(/Inner radius/)
    })

    test('uses the smaller side of the chart area for the outer radius', () => {
        const svg = draw({ width: 800, padAngle: 0, showRings: false })
        const a = svg.querySelector('path.sector')
        expect(farthestPoint(a)).toBeCloseTo(OUTER, 1)
    })
})
