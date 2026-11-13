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
  { category: '0-4', side: 'Male', value: 10 },
  { category: '0-4', side: 'Female', value: 20 },
  { category: '5-9', side: 'Male', value: 30 },
  { category: '5-9', side: 'Female', value: 40 },
  { category: '10-14', side: 'Male', value: 50 },
  { category: '10-14', side: 'Female', value: 0 },
]

const mapping = {
  category: { value: 'age' },
  side: { value: 'sex' },
  value: { value: 'pop', config: { aggregation: 'sum' } },
}

function draw(data = items, options = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  render(svg, data, { ...baseOptions, ...options }, mapping, [], {})
  return svg
}

describe('Population pyramid render', () => {
  test('draws the background first and the chart inside #viz', () => {
    const svg = draw()
    const first = svg.firstElementChild
    expect(first.tagName).toBe('rect')
    expect(first.getAttribute('id')).toBe('background')
    expect(first.getAttribute('fill')).toBe('#ffffff')
    expect(first.getAttribute('width')).toBe('600')
    expect(first.getAttribute('height')).toBe('400')
    expect(svg.querySelectorAll('#viz').length).toBe(1)
    expect(svg.querySelectorAll('#viz .bar-left').length).toBe(3)
    expect(svg.querySelectorAll('#viz .bar-right').length).toBe(3)
  })

  test('draws only the background when there is no data', () => {
    const svg = draw([])
    expect(svg.children).toHaveLength(1)
    expect(svg.firstElementChild.getAttribute('id')).toBe('background')
  })

  test('left and right bars share one scale and extend from the center', () => {
    const svg = draw()
    const left = Array.from(svg.querySelectorAll('.bar-left'))
    const right = Array.from(svg.querySelectorAll('.bar-right'))
    // chart width 560, center gap 60 -> each half is 250 px
    const halfWidth = 250
    const leftWidths = left.map((r) => Number(r.getAttribute('width')))
    const rightWidths = right.map((r) => Number(r.getAttribute('width')))
    // Male 10, 30, 50 / Female 20, 40, 0 ; both on the same scale
    expect(leftWidths[2] / leftWidths[0]).toBeCloseTo(5)
    expect(rightWidths[1] / rightWidths[0]).toBeCloseTo(2)
    expect(rightWidths[0] / leftWidths[0]).toBeCloseTo(2)
    expect(rightWidths[2]).toBe(0)
    // left bars end at the center side of the left half, right bars start at 0
    left.forEach((r, i) => {
      expect(Number(r.getAttribute('x')) + leftWidths[i]).toBeCloseTo(halfWidth)
    })
    right.forEach((r) => expect(r.getAttribute('x')).toBe('0'))
    // the right half is offset by half width + center gap
    expect(svg.querySelector('#right').getAttribute('transform')).toBe(
      `translate(${halfWidth + 60},0)`
    )
  })

  test('applies the colors from the options', () => {
    const svg = draw(items, { leftColor: '#111111', rightColor: '#222222' })
    expect(svg.querySelector('.bar-left').getAttribute('fill')).toBe('#111111')
    expect(svg.querySelector('.bar-right').getAttribute('fill')).toBe('#222222')
  })

  test('puts the first category at the bottom, and reverses on demand', () => {
    const yOf = (svg, i) =>
      Number(svg.querySelectorAll('.bar-left')[i].getAttribute('y'))
    const normal = draw()
    expect(yOf(normal, 0)).toBeGreaterThan(yOf(normal, 2))
    const reversed = draw(items, { reverseOrder: true })
    expect(yOf(reversed, 0)).toBeLessThan(yOf(reversed, 2))
  })

  test('puts centered category labels in the central band', () => {
    const svg = draw()
    const labels = Array.from(svg.querySelectorAll('.category-label'))
    expect(labels.map((t) => t.textContent)).toEqual(['0-4', '5-9', '10-14'])
    labels.forEach((t) => {
      expect(t.getAttribute('text-anchor')).toBe('middle')
      expect(t.getAttribute('x')).toBe('280')
      expect(t.getAttribute('font-family')).toBe('Arial, sans-serif')
      expect(t.getAttribute('font-size')).toBe('10')
    })
  })

  test('draws a bottom axis for each side with positive ticks', () => {
    const svg = draw()
    const leftTicks = Array.from(svg.querySelectorAll('#leftAxis .tick text'))
    const rightTicks = Array.from(svg.querySelectorAll('#rightAxis .tick text'))
    expect(leftTicks.length).toBeGreaterThan(1)
    expect(leftTicks.map((t) => t.textContent)).toEqual(
      rightTicks.map((t) => t.textContent)
    )
    leftTicks.forEach((t) => expect(t.textContent).not.toMatch(/[-−]/))
  })

  test('shows percentages when usePercentage is on', () => {
    const svg = draw(items, { usePercentage: true, showValueLabels: true })
    const ticks = Array.from(svg.querySelectorAll('#leftAxis .tick text'))
    ticks.forEach((t) => expect(t.textContent).toMatch(/%$/))
    // total is 150, so the largest value (Male 50) is 33.3%
    const labels = Array.from(svg.querySelectorAll('.value-label-left'))
    expect(labels[2].textContent).toBe('33.3%')
  })

  test('shows group names and value labels only when enabled', () => {
    const on = draw(items, { showValueLabels: true, labelFontSize: 14 })
    expect(on.querySelector('.side-label-left').textContent).toBe('Male')
    expect(on.querySelector('.side-label-right').textContent).toBe('Female')
    expect(on.querySelectorAll('.value-label-left')).toHaveLength(3)
    expect(on.querySelectorAll('.value-label-right')).toHaveLength(3)
    expect(
      on.querySelector('.value-label-right').getAttribute('font-size')
    ).toBe('14')
    expect(on.querySelector('.value-label-right').textContent).toBe('20')

    const off = draw(items, { showSideLabels: false })
    expect(off.querySelector('.side-label-left')).toBeNull()
    expect(off.querySelector('.value-label-left')).toBeNull()
  })

  test('throws readable errors for invalid input', () => {
    expect(() => draw(items.filter((d) => d.side === 'Male'))).toThrow(
      /exactly 2/
    )
    expect(() =>
      draw([
        { category: 'a', side: 'L', value: -1 },
        { category: 'a', side: 'R', value: 1 },
      ])
    ).toThrow(/negative/)
    expect(() => draw(items, { padding: 200 })).toThrow(/Padding is too high/)
    expect(() => draw(items, { centerGap: 600 })).toThrow(/too small/)
  })

  test('re-rendering replaces the previous drawing', () => {
    const svg = draw()
    render(svg, items, baseOptions, mapping, [], {})
    expect(svg.querySelectorAll('#background')).toHaveLength(1)
    expect(svg.querySelectorAll('.bar-left')).toHaveLength(3)
  })
})
