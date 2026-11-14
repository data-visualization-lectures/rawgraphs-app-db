import * as d3 from 'd3'
import render from './render'

const SVG_NS = 'http://www.w3.org/2000/svg'

const baseOptions = {
    width: 400,
    height: 300,
    background: '#ffffff',
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20,
    showLegend: false,
    legendWidth: 200,
    rows: 10,
    columns: 10,
    cellPadding: 2,
    cellShape: 'square',
    fillDirection: 'rowsTop',
    sortBy: 'original',
    colorScale: d3
        .scaleOrdinal()
        .domain(['A', 'B', 'C'])
        .range(['#111111', '#222222', '#333333']),
}

const mapping = {
    category: { value: 'mode' },
    value: { value: 'count', config: { aggregation: 'sum' } },
}

const dateMapping = {
    category: {
        value: 'day',
        dataType: { type: 'date', dateFormat: 'YYYY-MM-DD' },
    },
    value: { value: 'count', config: { aggregation: 'sum' } },
}

const data = [
    { category: 'A', value: 20 },
    { category: 'B', value: 50 },
    { category: 'C', value: 30 },
]

function draw(opts = {}, chartData = data, chartMapping = mapping) {
    const svg = document.createElementNS(SVG_NS, 'svg')
    render(svg, chartData, { ...baseOptions, ...opts }, chartMapping, [], {})
    return svg
}

const fills = (svg) =>
    Array.from(svg.querySelectorAll('.cell')).map((c) => c.getAttribute('fill'))
const num = (el, name) => Number(el.getAttribute(name))

describe('Waffle chart render', () => {
    // jsdom does not implement text measuring, which the core legend needs
    beforeAll(() => {
        window.SVGElement.prototype.getComputedTextLength = () => 10
        window.SVGElement.prototype.getBBox = () => ({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        })
    })
    afterAll(() => {
        delete window.SVGElement.prototype.getComputedTextLength
        delete window.SVGElement.prototype.getBBox
    })

    test('draws the background first, then the viz group', () => {
        const svg = draw()
        const [first, second] = svg.children
        expect(first.id).toBe('background')
        expect(first.tagName).toBe('rect')
        expect(first.getAttribute('fill')).toBe('#ffffff')
        expect(first.getAttribute('width')).toBe('400')
        expect(first.getAttribute('height')).toBe('300')
        expect(second.id).toBe('viz')
        expect(second.tagName).toBe('g')
        expect(svg.children).toHaveLength(2)
    })

    test('draws one cell per grid position, in proportion to the values', () => {
        const svg = draw()
        const cells = svg.querySelectorAll('rect.cell')
        expect(cells).toHaveLength(100)
        const counts = d3.rollup(
            fills(svg),
            (v) => v.length,
            (f) => f
        )
        expect(counts.get('#111111')).toBe(20)
        expect(counts.get('#222222')).toBe(50)
        expect(counts.get('#333333')).toBe(30)
    })

    test('fills the cells in the sorted order, item after item', () => {
        const svg = draw({ sortBy: 'totalDescending' })
        const f = fills(svg)
        expect(f.slice(0, 50).every((c) => c === '#222222')).toBe(true)
        expect(f.slice(50, 80).every((c) => c === '#333333')).toBe(true)
        expect(f.slice(80).every((c) => c === '#111111')).toBe(true)
    })

    test('sorts ascending, by name and in the original order', () => {
        const order = (sortBy) => {
            const f = fills(draw({ sortBy }))
            return [f[0], f[25], f[99]]
        }
        expect(order('totalAscending')).toEqual([
            '#111111',
            '#333333',
            '#222222',
        ])
        expect(order('original')).toEqual(['#111111', '#222222', '#333333'])
        const reversed = [
            { category: 'C', value: 30 },
            { category: 'B', value: 50 },
            { category: 'A', value: 20 },
        ]
        const f = fills(draw({ sortBy: 'name' }, reversed))
        expect([f[0], f[99]]).toEqual(['#111111', '#333333'])
        const original = fills(draw({ sortBy: 'original' }, reversed))
        expect(original[0]).toBe('#333333')
    })

    test('makes square cells from the smaller of width/columns and height/rows', () => {
        // drawing area 360 x 260, 10 x 10 cells: 26px slots, 2px gap
        const svg = draw()
        const cell = svg.querySelector('rect.cell')
        expect(num(cell, 'width')).toBeCloseTo(24)
        expect(num(cell, 'height')).toBeCloseTo(24)
    })

    test('centers the grid in the drawing area', () => {
        const svg = draw()
        const cells = Array.from(svg.querySelectorAll('rect.cell'))
        const xs = cells.map((c) => num(c, 'x'))
        const ys = cells.map((c) => num(c, 'y'))
        // slots are 26px; the grid is 260 wide in 360: 50px on each side
        // (cells are inset by half the padding)
        expect(Math.min(...xs)).toBeCloseTo(50 + 1)
        expect(Math.max(...xs) + 24).toBeCloseTo(310 - 1)
        expect(Math.min(...ys)).toBeCloseTo(1)
        expect(Math.max(...ys) + 24).toBeCloseTo(260 - 1)
        expect(svg.querySelector('#viz').getAttribute('transform')).toBe(
            'translate(20,20)'
        )
    })

    test('leaves the gap given by cellPadding between cells', () => {
        const cells = draw({ cellPadding: 6 }).querySelectorAll('rect.cell')
        expect(num(cells[0], 'width')).toBeCloseTo(20)
        expect(num(cells[1], 'x') - num(cells[0], 'x') - 20).toBeCloseTo(6)
    })

    test('draws circles when cellShape is circle', () => {
        const svg = draw({ cellShape: 'circle' })
        expect(svg.querySelectorAll('rect.cell')).toHaveLength(0)
        const circles = svg.querySelectorAll('circle.cell')
        expect(circles).toHaveLength(100)
        expect(num(circles[0], 'r')).toBeCloseTo(12)
        // the slots are the same as for squares
        const squares = draw().querySelectorAll('rect.cell')
        expect(num(circles[0], 'cx')).toBeCloseTo(
            num(squares[0], 'x') + num(squares[0], 'width') / 2
        )
    })

    test('fills rows from the top, left to right', () => {
        const cells = draw({ fillDirection: 'rowsTop' }).querySelectorAll(
            'rect.cell'
        )
        expect(num(cells[0], 'y')).toBeLessThan(num(cells[10], 'y'))
        expect(num(cells[0], 'x')).toBeLessThan(num(cells[1], 'x'))
        expect(num(cells[0], 'y')).toBe(num(cells[1], 'y'))
        expect(num(cells[0], 'x')).toBe(num(cells[10], 'x'))
    })

    test('fills rows from the bottom, left to right', () => {
        const cells = draw({ fillDirection: 'rowsBottom' }).querySelectorAll(
            'rect.cell'
        )
        expect(num(cells[0], 'y')).toBeGreaterThan(num(cells[10], 'y'))
        expect(num(cells[0], 'x')).toBeLessThan(num(cells[1], 'x'))
        expect(num(cells[0], 'y')).toBe(num(cells[1], 'y'))
        // the first cell is at the bottom of the grid
        const ys = Array.from(cells).map((c) => num(c, 'y'))
        expect(num(cells[0], 'y')).toBe(Math.max(...ys))
    })

    test('fills columns from the left, top to bottom', () => {
        const cells = draw({ fillDirection: 'columnsLeft' }).querySelectorAll(
            'rect.cell'
        )
        expect(num(cells[0], 'x')).toBe(num(cells[1], 'x'))
        expect(num(cells[0], 'y')).toBeLessThan(num(cells[1], 'y'))
        expect(num(cells[0], 'x')).toBeLessThan(num(cells[10], 'x'))
        expect(num(cells[0], 'y')).toBe(num(cells[10], 'y'))
    })

    test('uses rows x columns cells with non-square grids', () => {
        const svg = draw({ rows: 4, columns: 5 })
        expect(svg.querySelectorAll('.cell')).toHaveLength(20)
        // 360/5 = 72, 260/4 = 65: the smaller one is used
        const cell = svg.querySelector('rect.cell')
        expect(num(cell, 'width')).toBeCloseTo(63)
        expect(num(cell, 'height')).toBeCloseTo(63)
    })

    test('adds a title to each cell with the item, the value and the share', () => {
        const svg = draw()
        const titles = Array.from(svg.querySelectorAll('.cell > title'))
        expect(titles).toHaveLength(100)
        expect(titles[0].textContent).toBe('A: 20 (20.0%)')
        expect(titles[99].textContent).toBe('C: 30 (30.0%)')
    })

    test('shows the share of the value, not of the rounded cells', () => {
        const svg = draw(
            { rows: 2, columns: 2 },
            [
                { category: 'A', value: 1 },
                { category: 'B', value: 2 },
            ]
        )
        const titles = Array.from(svg.querySelectorAll('.cell > title')).map(
            (t) => t.textContent
        )
        expect(titles[0]).toBe('A: 1 (33.3%)')
        expect(titles[3]).toBe('B: 2 (66.7%)')
    })

    test('treats an empty value as 0', () => {
        const svg = draw({}, [
            { category: 'A', value: null },
            { category: 'B', value: 5 },
        ])
        expect(fills(svg).every((f) => f === '#222222')).toBe(true)
    })

    test('draws the legend with the title of the category column', () => {
        expect(draw().querySelector('#legend')).toBeNull()
        const svg = draw({ showLegend: true })
        const legend = svg.querySelector('#legend')
        expect(legend).not.toBeNull()
        expect(legend.getAttribute('transform')).toBe('translate(400,20)')
        expect(legend.textContent).toContain('mode')
        expect(legend.textContent).toContain('A')
        expect(legend.textContent).toContain('C')
    })

    test('widens the background and the svg for the legend', () => {
        const svg = draw({ showLegend: true })
        expect(svg.querySelector('#background').getAttribute('width')).toBe(
            '600'
        )
        expect(svg.getAttribute('width')).toBe('600')
        expect(svg.getAttribute('height')).toBe('300')
        expect(
            draw().querySelector('#background').getAttribute('width')
        ).toBe('400')
    })

    test('draws only the background for empty data', () => {
        const svg = draw({ showLegend: true }, [])
        expect(svg.children).toHaveLength(1)
        expect(svg.children[0].id).toBe('background')
    })

    test('redraws from scratch on a second call', () => {
        const svg = draw()
        render(svg, data, baseOptions, mapping, [], {})
        expect(svg.querySelectorAll('#background')).toHaveLength(1)
        expect(svg.querySelectorAll('#viz')).toHaveLength(1)
        expect(svg.querySelectorAll('.cell')).toHaveLength(100)
    })

    test('does not modify the data', () => {
        const copy = JSON.parse(JSON.stringify(data))
        const input = data.map((d) => ({ ...d }))
        draw({ sortBy: 'totalDescending' }, input)
        expect(input).toEqual(copy)
    })

    test('throws when rows or columns are not integers of 1 or more', () => {
        expect(() => draw({ rows: 0 })).toThrow(/Rows/)
        expect(() => draw({ rows: -2 })).toThrow(/Rows/)
        expect(() => draw({ rows: 2.5 })).toThrow(/Rows/)
        expect(() => draw({ columns: 0 })).toThrow(/Columns/)
        expect(() => draw({ columns: 1.5 })).toThrow(/Columns/)
        expect(() => draw({ columns: NaN })).toThrow(/Columns/)
    })

    test('throws when the margins leave no room for the chart', () => {
        expect(() => draw({ marginLeft: 300, marginRight: 100 })).toThrow(
            /Margins are too large/
        )
        expect(() => draw({ marginTop: 200, marginBottom: 100 })).toThrow(
            /Margins are too large/
        )
    })

    test('throws when the cell padding leaves no room for the cells', () => {
        expect(() => draw({ cellPadding: 26 })).toThrow(/Cell padding/)
        expect(() => draw({ cellPadding: 100 })).toThrow(/Cell padding/)
    })

    test('throws when rows x columns is more than 10000', () => {
        expect(() => draw({ rows: 101, columns: 100 })).toThrow(/10000/)
        expect(() => draw({ rows: 1, columns: 10001 })).toThrow(
            /at most 10000 cells/
        )
        expect(() =>
            draw({ rows: 100, columns: 100, cellPadding: 0 })
        ).not.toThrow()
    })

    test('throws a readable error for invalid values', () => {
        expect(() => draw({}, [{ category: 'A', value: 0 }])).toThrow(
            /greater than 0/
        )
        expect(() => draw({}, [{ category: 'A', value: -1 }])).toThrow(
            /negative/
        )
        expect(() => draw({}, [{ category: 'A', value: 'x' }])).toThrow(
            /needs one number/
        )
    })

    test('uses the labels in the error messages', () => {
        const svgData = [{ category: new Date(2024, 0, 1), value: -1 }]
        expect(() => draw({}, svgData, dateMapping)).toThrow(
            /for 2024-01-01\)?\./
        )
    })
})

describe('Waffle chart render with date categories', () => {
    beforeAll(() => {
        window.SVGElement.prototype.getComputedTextLength = () => 10
        window.SVGElement.prototype.getBBox = () => ({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        })
    })
    afterAll(() => {
        delete window.SVGElement.prototype.getComputedTextLength
        delete window.SVGElement.prototype.getBBox
    })

    const jan1 = new Date(2024, 0, 1)
    const jan2 = new Date(2024, 0, 2)
    const dates = [
        { category: jan1, value: 25 },
        { category: jan2, value: 75 },
    ]
    // the domain is made of Date objects, as the color scale UI does for a date column
    const dateScale = d3
        .scaleOrdinal()
        .domain([jan1, jan2])
        .range(['#aa0000', '#00aa00'])

    test('writes the labels in the format of the input column', () => {
        const svg = draw(
            { colorScale: dateScale },
            dates,
            dateMapping
        )
        const titles = Array.from(svg.querySelectorAll('.cell > title'))
        expect(titles[0].textContent).toBe('2024-01-01: 25 (25.0%)')
        expect(titles[99].textContent).toBe('2024-01-02: 75 (75.0%)')
    })

    test('colors the cells with the result of the color scale for the Date', () => {
        const svg = draw({ colorScale: dateScale }, dates, dateMapping)
        const f = fills(svg)
        expect(f[0]).toBe(dateScale(new Date(2024, 0, 1)))
        expect(f[0]).toBe('#aa0000')
        expect(f[99]).toBe(dateScale(new Date(2024, 0, 2)))
        expect(f[99]).toBe('#00aa00')
        expect(f.filter((c) => c === '#aa0000')).toHaveLength(25)
    })

    test('passes the Date, not text, to the color scale', () => {
        const received = []
        const spy = (value) => {
            received.push(value)
            return '#123456'
        }
        draw({ colorScale: spy }, dates, dateMapping)
        expect(received.length).toBeGreaterThan(0)
        received.forEach((v) => expect(v).toBeInstanceOf(Date))
    })

    test('shows the formatted labels in the legend', () => {
        const svg = draw(
            { colorScale: dateScale, showLegend: true },
            dates,
            dateMapping
        )
        const text = svg.querySelector('#legend').textContent
        expect(text).toContain('day')
        expect(text).toContain('2024-01-01')
        expect(text).toContain('2024-01-02')
        expect(text).not.toContain('GMT')
    })

    test('sorts dates by time in the name sorting', () => {
        const later = [
            { category: jan2, value: 75 },
            { category: jan1, value: 25 },
        ]
        const f = fills(
            draw({ colorScale: dateScale, sortBy: 'name' }, later, dateMapping)
        )
        expect(f[0]).toBe('#aa0000')
        expect(f[99]).toBe('#00aa00')
    })

    test('falls back to String() when the mapping has no date type', () => {
        const svg = draw({ colorScale: dateScale }, dates, {
            category: { value: 'day' },
        })
        const title = svg.querySelector('.cell > title').textContent
        expect(title).toMatch(/^Mon Jan 01 2024/)
    })

    test('works without a category mapping', () => {
        const svg = draw({ showLegend: true }, data, {})
        expect(svg.querySelectorAll('#viz .cell')).toHaveLength(100)
        expect(svg.querySelector('#legend').textContent).toContain('A')
    })
})

describe('Waffle chart render with number categories', () => {
    beforeAll(() => {
        window.SVGElement.prototype.getComputedTextLength = () => 10
        window.SVGElement.prototype.getBBox = () => ({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        })
    })
    afterAll(() => {
        delete window.SVGElement.prototype.getComputedTextLength
        delete window.SVGElement.prototype.getBBox
    })

    const numberMapping = {
        category: { value: 'n', dataType: { type: 'number' } },
        value: { value: 'count', config: { aggregation: 'sum' } },
    }
    const numbers = [
        { category: 10, value: 50 },
        { category: 9, value: 30 },
        { category: 100, value: 20 },
    ]
    // a scale that tells the 9 and the 10 apart, as a numeric domain does
    const numberScale = d3
        .scaleOrdinal()
        .domain([9, 10, 100])
        .range(['#090909', '#101010', '#aaaaaa'])

    test('passes numbers, not text, to the color scale', () => {
        const received = []
        const spy = (value) => {
            received.push(value)
            return '#123456'
        }
        draw({ colorScale: spy }, numbers, numberMapping)
        expect(received.length).toBeGreaterThan(0)
        received.forEach((v) => expect(typeof v).toBe('number'))
    })

    test('colors 10 and 9 differently', () => {
        const svg = draw({ colorScale: numberScale }, numbers, numberMapping)
        const f = fills(svg)
        expect(f[0]).toBe('#101010')
        expect(f[50]).toBe('#090909')
        expect(f[80]).toBe('#aaaaaa')
    })

    test('shows the numbers as text in titles and in the legend', () => {
        const svg = draw(
            { colorScale: numberScale, showLegend: true },
            numbers,
            numberMapping
        )
        expect(svg.querySelector('.cell > title').textContent).toBe(
            '10: 50 (50.0%)'
        )
        const text = svg.querySelector('#legend').textContent
        expect(text).toContain('100')
        expect(text).toContain('9')
    })

    test('lists the numbers as text in the legend, in the drawing order', () => {
        const svg = draw(
            { colorScale: numberScale, showLegend: true, sortBy: 'name' },
            numbers,
            numberMapping
        )
        const legendLabels = Array.from(
            svg.querySelectorAll('#legend text.label')
        ).map((t) => t.textContent)
        expect(legendLabels).toEqual(['9', '10', '100'])
    })

    test('sorts numbers by value in the name sorting', () => {
        const f = fills(
            draw(
                { colorScale: numberScale, sortBy: 'name' },
                numbers,
                numberMapping
            )
        )
        // 9 (30 cells), 10 (50 cells), 100 (20 cells)
        expect(f[0]).toBe('#090909')
        expect(f[30]).toBe('#101010')
        expect(f[99]).toBe('#aaaaaa')
    })

    test('sorts text with numbers in natural order in the name sorting', () => {
        const months = ['10月', '2月', '1月'].map((category) => ({
            category,
            value: 1,
        }))
        const scale = d3
            .scaleOrdinal()
            .domain(['1月', '2月', '10月'])
            .range(['#010101', '#020202', '#101010'])
        const titles = Array.from(
            draw(
                { colorScale: scale, sortBy: 'name', rows: 1, columns: 3 },
                months
            ).querySelectorAll('.cell > title')
        ).map((t) => t.textContent.split(':')[0])
        expect(titles).toEqual(['1月', '2月', '10月'])
    })
})
