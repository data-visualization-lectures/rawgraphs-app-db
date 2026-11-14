import render from './render'
import { visualOptions as optionDefs } from './visualOptions'

const defaults = Object.keys(optionDefs).reduce((acc, key) => {
  acc[key] = optionDefs[key].default
  return acc
}, {})

const baseOptions = {
  ...defaults,
  width: 600,
  height: 400,
  background: '#ffffff',
}

const items = [
  { category: 'Japanese', start: 60, end: 80 },
  { category: 'Math', start: 90, end: 70 },
  { category: 'Science', start: 50, end: 100 },
]

const mapping = {
  category: { value: 'subject' },
  startValue: { value: 'Term 1', config: { aggregation: 'sum' } },
  endValue: { value: 'Term 3', config: { aggregation: 'sum' } },
}

function draw(data = items, options = {}, map = mapping) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  render(svg, data, { ...baseOptions, ...options }, map, [], {})
  return svg
}

const num = (el, name) => Number(el.getAttribute(name))

// jsdom does not measure text or boxes; the legend of the core needs both
// to wrap its labels and to place its cells
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

describe('Dumbbell chart render', () => {
  test('draws the background first and the chart inside #viz', () => {
    const svg = draw(items, { showLegend: false })
    const first = svg.firstElementChild
    expect(first.tagName).toBe('rect')
    expect(first.getAttribute('id')).toBe('background')
    expect(first.getAttribute('fill')).toBe('#ffffff')
    expect(first.getAttribute('width')).toBe('600')
    expect(first.getAttribute('height')).toBe('400')
    expect(svg.children[1].getAttribute('id')).toBe('viz')
    expect(svg.querySelectorAll('#viz').length).toBe(1)
    expect(svg.querySelectorAll('#viz .connector')).toHaveLength(3)
    expect(svg.querySelectorAll('#viz .dot-start')).toHaveLength(3)
    expect(svg.querySelectorAll('#viz .dot-end')).toHaveLength(3)
  })

  test('draws only the background when there is no data', () => {
    const svg = draw([])
    expect(svg.children).toHaveLength(1)
    expect(svg.firstElementChild.getAttribute('id')).toBe('background')
    const none = draw([{ category: 'a', start: null, end: null }])
    expect(none.children).toHaveLength(1)
  })

  test('draws lines before dots, and dots on one horizontal line per item', () => {
    const svg = draw(items, { showLegend: false })
    const all = Array.from(svg.querySelectorAll('.connector, circle'))
    const lastLine = all.map((e) => e.tagName).lastIndexOf('line')
    const firstCircle = all.map((e) => e.tagName).indexOf('circle')
    expect(lastLine).toBeLessThan(firstCircle)

    const lines = Array.from(svg.querySelectorAll('.connector'))
    const starts = Array.from(svg.querySelectorAll('.dot-start'))
    const ends = Array.from(svg.querySelectorAll('.dot-end'))
    lines.forEach((line, i) => {
      expect(line.getAttribute('y1')).toBe(line.getAttribute('y2'))
      expect(line.getAttribute('y1')).toBe(starts[i].getAttribute('cy'))
      expect(starts[i].getAttribute('cy')).toBe(ends[i].getAttribute('cy'))
      expect(line.getAttribute('x1')).toBe(starts[i].getAttribute('cx'))
      expect(line.getAttribute('x2')).toBe(ends[i].getAttribute('cx'))
    })
  })

  test('puts values on one linear scale: higher value, further right', () => {
    const svg = draw(items, { showLegend: false })
    const starts = Array.from(svg.querySelectorAll('.dot-start')).map((e) =>
      num(e, 'cx')
    )
    const ends = Array.from(svg.querySelectorAll('.dot-end')).map((e) =>
      num(e, 'cx')
    )
    // Japanese 60 -> 80, Math 90 -> 70, Science 50 -> 100
    expect(ends[0]).toBeGreaterThan(starts[0])
    expect(ends[1]).toBeLessThan(starts[1])
    expect(starts[0] - starts[2]).toBeCloseTo((ends[0] - starts[0]) / 2)
    expect(ends[2] - starts[2]).toBeGreaterThan(ends[0] - starts[0])
  })

  test('puts the first item on top', () => {
    const svg = draw()
    const ys = Array.from(svg.querySelectorAll('.dot-start')).map((e) =>
      num(e, 'cy')
    )
    expect(ys[0]).toBeLessThan(ys[1])
    expect(ys[1]).toBeLessThan(ys[2])
  })

  test('applies size and color options', () => {
    const svg = draw(items, {
      dotDiameter: 14,
      lineWidth: 5,
      startColor: '#111111',
      endColor: '#222222',
      lineColor: '#333333',
    })
    const start = svg.querySelector('.dot-start')
    const end = svg.querySelector('.dot-end')
    const line = svg.querySelector('.connector')
    expect(start.getAttribute('r')).toBe('7')
    expect(start.getAttribute('fill')).toBe('#111111')
    expect(end.getAttribute('fill')).toBe('#222222')
    expect(line.getAttribute('stroke')).toBe('#333333')
    expect(line.getAttribute('stroke-width')).toBe('5')
  })

  test('puts a title on each dot: item / column name: value', () => {
    const svg = draw(items, {}, { ...mapping })
    expect(svg.querySelector('.dot-start title').textContent).toBe(
      'Japanese / Term 1: 60'
    )
    expect(svg.querySelector('.dot-end title').textContent).toBe(
      'Japanese / Term 3: 80'
    )
  })

  test('draws neither a dot nor a line for an empty value', () => {
    const svg = draw([
      { category: 'a', start: 10, end: 20 },
      { category: 'b', start: null, end: 30 },
      { category: 'c', start: 40, end: null },
    ])
    expect(svg.querySelectorAll('.connector')).toHaveLength(1)
    expect(svg.querySelectorAll('.dot-start')).toHaveLength(2)
    expect(svg.querySelectorAll('.dot-end')).toHaveLength(2)
    // the item names of the three items are all on the axis
    const names = Array.from(
      svg.querySelectorAll('#categoryAxis .tick text')
    ).map((t) => t.textContent)
    expect(names).toEqual(['a', 'b', 'c'])
  })

  test('leaves out items whose values are both empty', () => {
    const svg = draw([
      { category: 'a', start: 10, end: 20 },
      { category: 'b', start: null, end: null },
    ])
    const names = Array.from(
      svg.querySelectorAll('#categoryAxis .tick text')
    ).map((t) => t.textContent)
    expect(names).toEqual(['a'])
  })

  test('sorts the items: numeric keys descending from the top', () => {
    const order = (sortBy) => {
      const svg = draw(items, { sortBy })
      return Array.from(svg.querySelectorAll('#categoryAxis .tick text')).map(
        (t) => t.textContent
      )
    }
    expect(order('original')).toEqual(['Japanese', 'Math', 'Science'])
    expect(order('start')).toEqual(['Math', 'Japanese', 'Science'])
    expect(order('end')).toEqual(['Science', 'Japanese', 'Math'])
    expect(order('difference')).toEqual(['Science', 'Japanese', 'Math'])
    expect(order('name')).toEqual(['Japanese', 'Math', 'Science'])
  })

  test('the value axis fits the data, or includes 0 on demand', () => {
    const ticks = (options) =>
      Array.from(
        draw(items, options).querySelectorAll('#valueAxis .tick text')
      ).map((t) => Number(t.textContent))
    const fitted = ticks({ startAtZero: false })
    expect(Math.min(...fitted)).toBeGreaterThanOrEqual(40)
    expect(Math.min(...fitted)).toBeLessThanOrEqual(50)
    expect(Math.max(...fitted)).toBe(100)
    const fromZero = ticks({ startAtZero: true })
    expect(Math.min(...fromZero)).toBe(0)
    expect(Math.max(...fromZero)).toBe(100)
  })

  test('the left axis has no tick marks and no axis line', () => {
    const svg = draw()
    expect(svg.querySelectorAll('#categoryAxis .domain')).toHaveLength(0)
    svg.querySelectorAll('#categoryAxis .tick line').forEach((l) => {
      expect(l.getAttribute('x2')).toBe('0')
    })
    expect(svg.querySelectorAll('#valueAxis .domain')).toHaveLength(1)
    svg.querySelectorAll('#viz text').forEach((t) => {
      expect(t.getAttribute('font-family')).toBe('Arial, sans-serif')
    })
  })

  test('formats date categories with the format of the input', () => {
    const svg = draw(
      [
        { category: new Date(2020, 2, 5), start: 1, end: 2 },
        { category: new Date(2021, 10, 25), start: 2, end: 3 },
      ],
      {},
      {
        ...mapping,
        category: {
          value: 'when',
          dataType: { type: 'date', dateFormat: 'YYYY-MM-DD' },
        },
      }
    )
    const names = Array.from(
      svg.querySelectorAll('#categoryAxis .tick text')
    ).map((t) => t.textContent)
    expect(names).toEqual(['2020-03-05', '2021-11-25'])
    expect(svg.querySelector('.dot-start title').textContent).toBe(
      '2020-03-05 / Term 1: 1'
    )
  })

  test('draws grid lines at the position of each item, only when enabled', () => {
    const on = draw(items, { showGrid: true })
    const grid = Array.from(on.querySelectorAll('.grid-line'))
    expect(grid).toHaveLength(3)
    const dotYs = Array.from(on.querySelectorAll('.dot-start')).map((e) =>
      e.getAttribute('cy')
    )
    expect(grid.map((l) => l.getAttribute('y1'))).toEqual(dotYs)
    expect(
      draw(items, { showGrid: false }).querySelector('.grid-line')
    ).toBeNull()
  })

  test('shows value labels outside the dots, the smaller on the left', () => {
    const svg = draw(items, { showValueLabels: true, labelFontSize: 13 })
    const left = Array.from(svg.querySelectorAll('.value-label-left'))
    const right = Array.from(svg.querySelectorAll('.value-label-right'))
    expect(left.map((t) => t.textContent)).toEqual(['60', '70', '50'])
    expect(right.map((t) => t.textContent)).toEqual(['80', '90', '100'])
    expect(left[0].getAttribute('text-anchor')).toBe('end')
    expect(right[0].getAttribute('text-anchor')).toBe('start')
    expect(left[0].getAttribute('font-size')).toBe('13')
    // the left label is left of the left dot, the right label right of the right dot
    const starts = Array.from(svg.querySelectorAll('.dot-start'))
    const ends = Array.from(svg.querySelectorAll('.dot-end'))
    expect(num(left[0], 'x')).toBeLessThan(num(starts[0], 'cx') - 5)
    expect(num(right[0], 'x')).toBeGreaterThan(num(ends[0], 'cx') + 5)
    // Math goes down: its start (90) is the larger one
    expect(num(right[1], 'x')).toBeGreaterThan(num(starts[1], 'cx') + 5)

    expect(
      draw(items, { showValueLabels: false }).querySelector('#valueLabels')
    ).toBeNull()
  })

  test('shows the single value of an item with an empty value on the right', () => {
    const svg = draw(
      [
        { category: 'a', start: null, end: 30 },
        { category: 'b', start: 10, end: 20 },
      ],
      { showValueLabels: true }
    )
    expect(svg.querySelectorAll('.value-label-right')).toHaveLength(2)
    expect(svg.querySelectorAll('.value-label-left')).toHaveLength(1)
  })

  describe('legend', () => {
    test('is drawn at the right of the chart, and widens the background', () => {
      const svg = draw(items, { showLegend: true, legendWidth: 150 })
      expect(svg.querySelector('#background').getAttribute('width')).toBe('750')
      const legendNode = svg.querySelector('#legend')
      expect(legendNode.getAttribute('transform')).toBe('translate(600,30)')
      const labels = Array.from(legendNode.querySelectorAll('.label')).map(
        (t) => t.textContent
      )
      expect(labels).toEqual(['Term 1', 'Term 3'])
      const fills = Array.from(legendNode.querySelectorAll('.swatch')).map(
        (r) => r.style.fill
      )
      expect(fills).toEqual(['#5b8db8', '#d1605e'])
    })

    test('uses the colors of the options', () => {
      const svg = draw(items, { startColor: '#010101', endColor: '#020202' })
      const fills = Array.from(svg.querySelectorAll('#legend .swatch')).map(
        (r) => r.style.fill
      )
      expect(fills).toEqual(['#010101', '#020202'])
    })

    test('is not drawn when disabled', () => {
      const svg = draw(items, { showLegend: false })
      expect(svg.querySelector('#legend')).toBeNull()
      expect(svg.querySelector('#background').getAttribute('width')).toBe('600')
    })
  })

  test('throws readable errors for invalid input', () => {
    expect(() => draw([{ category: 'a', start: 'x', end: 1 }])).toThrow(
      /needs one number/
    )
    expect(() => draw(items, { marginLeft: 400, marginRight: 300 })).toThrow(
      /too small/
    )
    expect(() => draw(items, { marginTop: 200, marginBottom: 200 })).toThrow(
      /too small/
    )
  })

  test('re-rendering replaces the previous drawing', () => {
    const svg = draw()
    render(svg, items, baseOptions, mapping, [], {})
    expect(svg.querySelectorAll('#background')).toHaveLength(1)
    expect(svg.querySelectorAll('#legend')).toHaveLength(1)
    expect(svg.querySelectorAll('.connector')).toHaveLength(3)
  })
})
