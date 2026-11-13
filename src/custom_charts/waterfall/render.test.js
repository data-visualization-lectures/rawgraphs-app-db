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

const mapping = {
  category: { value: 'item' },
  value: { value: 'amount', config: { aggregation: 'sum' } },
}

const data = [
  { category: 'Revenue', value: 100 },
  { category: 'Cost', value: -40 },
  { category: 'Gain', value: 25 },
]

const draw = (opts = {}, rows = data) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  render(svg, rows, { ...baseOptions, ...opts }, mapping, [], {})
  return svg
}

describe('Waterfall render', () => {
  test('draws only the background for empty data', () => {
    const svg = draw({}, [])
    expect(svg.querySelectorAll('#background')).toHaveLength(1)
    expect(svg.querySelector('#background').getAttribute('fill')).toBe(
      '#ffffff'
    )
    expect(svg.querySelector('#viz')).toBeNull()
    expect(svg.querySelectorAll('rect')).toHaveLength(1)
  })

  test('draws one bar per step plus the total', () => {
    const svg = draw()
    expect(svg.querySelectorAll('#viz rect.bar')).toHaveLength(4)
  })

  test('omits the total bar when showTotal is false', () => {
    const svg = draw({ showTotal: false })
    expect(svg.querySelectorAll('rect.bar')).toHaveLength(3)
  })

  test('colors the bars by type', () => {
    const bars = Array.from(draw().querySelectorAll('rect.bar')).map((r) =>
      r.getAttribute('fill')
    )
    expect(bars).toEqual(['#4e9a6b', '#d1605e', '#4e9a6b', '#5b7083'])
  })

  test('places floating bars from the cumulative start to the end', () => {
    const bars = Array.from(draw().querySelectorAll('rect.bar')).map((r) => ({
      y: Number(r.getAttribute('y')),
      h: Number(r.getAttribute('height')),
    }))
    // bar 0: 0 -> 100, bar 1: 100 -> 60, bar 2: 60 -> 85, total: 0 -> 85
    expect(bars[0].y + bars[0].h).toBeCloseTo(bars[3].y + bars[3].h)
    expect(bars[1].y).toBeCloseTo(bars[0].y)
    expect(bars[2].y + bars[2].h).toBeCloseTo(bars[1].y + bars[1].h)
    expect(bars[1].h).toBeCloseTo(bars[0].h * 0.4)
    expect(bars[2].h).toBeCloseTo(bars[0].h * 0.25)
  })

  test('draws connectors between adjacent bars only', () => {
    expect(draw().querySelectorAll('line.connector')).toHaveLength(3)
    expect(
      draw({ showConnectors: false }).querySelectorAll('line.connector')
    ).toHaveLength(0)
  })

  test('shows value labels with a plus sign for increases', () => {
    const labels = Array.from(draw().querySelectorAll('text.value-label')).map(
      (t) => t.textContent
    )
    expect(labels[0]).toBe('+100')
    expect(labels[1]).toMatch(/40$/)
    expect(labels[1].startsWith('+')).toBe(false)
    expect(labels[2]).toBe('+25')
    expect(labels[3]).toBe('85')
    expect(
      draw({ showValueLabels: false }).querySelectorAll('text.value-label')
    ).toHaveLength(0)
  })

  test('draws axes, zero line and the total label', () => {
    const svg = draw({ totalLabel: 'Net' })
    expect(svg.querySelector('#zeroLine')).not.toBeNull()
    expect(svg.querySelector('#yAxis')).not.toBeNull()
    const ticks = Array.from(
      svg.querySelectorAll('#xAxis .tick text')
    ).map((t) => t.textContent)
    expect(ticks).toEqual(['Revenue', 'Cost', 'Gain', 'Net'])
  })

  test('keeps bars when a category is named like the total label', () => {
    const svg = draw({}, [{ category: 'Total', value: 10 }])
    expect(svg.querySelectorAll('rect.bar')).toHaveLength(2)
  })

  test('handles negative cumulative values', () => {
    const svg = draw({}, [
      { category: 'A', value: -50 },
      { category: 'B', value: 20 },
    ])
    expect(svg.querySelectorAll('rect.bar')).toHaveLength(3)
    svg.querySelectorAll('rect.bar').forEach((r) => {
      expect(Number(r.getAttribute('height'))).toBeGreaterThan(0)
    })
  })

  test('rotates the x axis labels', () => {
    const svg = draw({ xAxisLabelRotation: '45' })
    expect(
      svg.querySelector('#xAxis .tick text').getAttribute('transform')
    ).toBe('rotate(-45)')
  })

  test('throws when padding is too high', () => {
    expect(() => draw({ padding: 1000 })).toThrow(/Padding is too high/)
  })

  test('throws when a value is not a number', () => {
    expect(() => draw({}, [{ category: 'A', value: NaN }])).toThrow(
      /not numbers/
    )
  })
})
