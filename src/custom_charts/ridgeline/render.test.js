import * as d3 from 'd3'
import render from './render'
import { silvermanBandwidth } from './mapping'
import { visualOptions as optionDefs } from './visualOptions'

const defaults = Object.keys(optionDefs).reduce((acc, key) => {
  acc[key] = optionDefs[key].default
  return acc
}, {})

// the app turns the colorScale option into a function before calling render
const baseOptions = {
  ...defaults,
  width: 600,
  height: 400,
  background: '#ffffff',
  colorScale: d3.scaleOrdinal().range(['#aa0000', '#00aa00', '#0000aa']),
}

// three groups, two with the same spread and one much wider
const items = [
  ...[8, 9, 10, 11, 12].map((value) => ({ group: 'Cold', value })),
  ...[18, 19, 20, 21, 22].map((value) => ({ group: 'Mild', value })),
  ...[10, 20, 30, 40, 50].map((value) => ({ group: 'Wide', value })),
]

const groupedMapping = {
  value: { value: 'temp' },
  group: { value: 'city' },
}

function draw(data = items, options = {}, mapping = groupedMapping) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  render(svg, data, { ...baseOptions, ...options }, mapping, [], {})
  return svg
}

const numbersOf = (d) => d.match(/-?\d+(\.\d+)?(e-?\d+)?/g).map(Number)
// the y coordinates of a path made of M / L / C / Z commands, which only have x,y pairs
const yOf = (d) => numbersOf(d).filter((_, i) => i % 2 === 1)
const labelY = (svg) =>
  Array.from(svg.querySelectorAll('.group-label')).map((t) =>
    Number(t.getAttribute('y'))
  )
const labelTexts = (svg) =>
  Array.from(svg.querySelectorAll('.group-label')).map((t) => t.textContent)

describe('Ridgeline render', () => {
  test('draws the background first and the chart inside #viz', () => {
    const svg = draw()
    const first = svg.firstElementChild
    expect(first.tagName).toBe('rect')
    expect(first.getAttribute('id')).toBe('background')
    expect(first.getAttribute('fill')).toBe('#ffffff')
    expect(first.getAttribute('width')).toBe('600')
    expect(first.getAttribute('height')).toBe('400')
    expect(svg.querySelectorAll('#viz')).toHaveLength(1)
    expect(svg.querySelector('#viz').getAttribute('transform')).toBe(
      'translate(100,40)'
    )
    expect(svg.querySelectorAll('#viz path.ridge')).toHaveLength(3)
  })

  test('draws only the background when there is no data', () => {
    const svg = draw([])
    expect(svg.children).toHaveLength(1)
    expect(svg.firstElementChild.getAttribute('id')).toBe('background')
  })

  test('draws the groups from top to bottom in the order of the data, top group first in the DOM', () => {
    const svg = draw()
    expect(labelTexts(svg)).toEqual(['Cold', 'Mild', 'Wide'])
    const ys = labelY(svg)
    expect(ys[0]).toBeLessThan(ys[1])
    expect(ys[1]).toBeLessThan(ys[2])
    // colors follow the groups, in the same order as the DOM
    const fills = Array.from(svg.querySelectorAll('.ridge')).map((p) =>
      p.getAttribute('fill')
    )
    expect(fills).toEqual(['#aa0000', '#00aa00', '#0000aa'])
  })

  test('baselines are evenly spaced, the last one is on the x axis and the top curve fits in the chart', () => {
    // chart height 330, 3 groups, overlap 1.5: 330 / (2 + 1.5)
    const step = 330 / 3.5
    const svg = draw(items, { curveType: 'linear', sameScale: false })
    const ys = labelY(svg)
    expect(ys[0]).toBeCloseTo(330 - 2 * step, 6)
    expect(ys[1]).toBeCloseTo(330 - step, 6)
    expect(ys[2]).toBeCloseTo(330, 6)
    expect(svg.querySelector('#xAxis').getAttribute('transform')).toBe(
      'translate(0,330)'
    )
    const paths = Array.from(svg.querySelectorAll('.ridge'))
    const tops = paths.map((p) => Math.min(...yOf(p.getAttribute('d'))))
    // with one height scale per group each peak is overlap * step above its baseline
    tops.forEach((top, i) => expect(top).toBeCloseTo(ys[i] - 1.5 * step, 6))
    expect(tops[0]).toBeCloseTo(0, 6)
    paths.forEach((p) => {
      const all = yOf(p.getAttribute('d'))
      expect(Math.max(...all)).toBeLessThanOrEqual(330 + 1e-6)
    })
  })

  test('overlap is the height of the tallest curve in row spacings', () => {
    const svg = draw(items, {
      curveType: 'linear',
      sameScale: false,
      overlap: 1,
    })
    const ys = labelY(svg)
    const step = ys[1] - ys[0]
    expect(step).toBeCloseTo(330 / 3, 6)
    const tops = Array.from(svg.querySelectorAll('.ridge')).map((p) =>
      Math.min(...yOf(p.getAttribute('d')))
    )
    tops.forEach((top, i) => expect(ys[i] - top).toBeCloseTo(step, 6))
  })

  test('a single group fills the chart height', () => {
    const svg = draw(
      items.filter((d) => d.group === 'Cold'),
      { curveType: 'linear' }
    )
    const d = svg.querySelector('.ridge').getAttribute('d')
    expect(Math.min(...yOf(d))).toBeCloseTo(0, 6)
    expect(Math.max(...yOf(d))).toBeCloseTo(330, 6)
  })

  test('sameScale shares one height scale; turning it off aligns the peak of each group', () => {
    const peakHeights = (svg) => {
      const ys = labelY(svg)
      return Array.from(svg.querySelectorAll('.ridge')).map(
        (p, i) => ys[i] - Math.min(...yOf(p.getAttribute('d')))
      )
    }
    const shared = peakHeights(draw(items, { curveType: 'linear' }))
    // the wide group is much lower than the narrow ones, which are equally high
    // (the peak is read on the sampled points, so the two differ by a fraction of a pixel)
    expect(shared[0]).toBeCloseTo(shared[1], 0)
    expect(shared[2]).toBeLessThan(shared[0] * 0.5)
    const own = peakHeights(
      draw(items, { curveType: 'linear', sameScale: false })
    )
    expect(own[2]).toBeCloseTo(own[0], 6)
    expect(own[1]).toBeCloseTo(own[0], 6)
  })

  test('the curve has one point per sample', () => {
    const svg = draw(items, { curveType: 'linear', samples: 10 })
    const d = svg.querySelector('.ridge').getAttribute('d')
    // the top line and the baseline, 10 points each
    expect(numbersOf(d)).toHaveLength(2 * 2 * 10)
    const minimal = draw(items, { curveType: 'linear', samples: 2 })
    expect(
      numbersOf(minimal.querySelector('.ridge').getAttribute('d'))
    ).toHaveLength(2 * 2 * 2)
  })

  test('Smooth and Linear give different curves', () => {
    const basis = draw(items, { curveType: 'basis' })
    const linear = draw(items, { curveType: 'linear' })
    expect(basis.querySelector('.ridge').getAttribute('d')).toMatch(/C/)
    expect(linear.querySelector('.ridge').getAttribute('d')).not.toMatch(/C/)
  })

  test('the x domain is the range of all the values widened by 3 bandwidths on both sides', () => {
    // values 15..25, bandwidth 5: [0, 40]
    const data = [15, 20, 25].map((value) => ({ group: 'A', value }))
    const svg = draw(data, { bandwidth: 5 })
    const ticks = Array.from(svg.querySelectorAll('#xAxis .tick'))
    const at = (tick) =>
      Number(
        /translate\(([-\d.e]+),0\)/.exec(tick.getAttribute('transform'))[1]
      )
    const value = (tick) => Number(tick.textContent.replace('−', '-'))
    // chart width is 480, so a tick at v is v / 40 * 480 from the left edge;
    // d3.axis shifts every tick by the same half pixel, which cancels out here
    ticks.forEach((tick) =>
      expect(at(tick) - at(ticks[0])).toBeCloseTo(
        ((value(tick) - value(ticks[0])) / 40) * 480,
        6
      )
    )
    expect(value(ticks[0])).toBe(0)
    expect(value(ticks[ticks.length - 1])).toBe(40)
  })

  test('bandwidth 0 uses the Silverman bandwidth of all the values together', () => {
    const all = items.map((d) => d.value)
    const auto = draw(items)
    const manual = draw(items, { bandwidth: silvermanBandwidth(all) })
    const paths = (svg) =>
      Array.from(svg.querySelectorAll('.ridge')).map((p) => p.getAttribute('d'))
    expect(paths(auto)).toEqual(paths(manual))
    expect(paths(draw(items, { bandwidth: 1 }))).not.toEqual(paths(auto))
  })

  test('draws the group names at the baseline, right aligned, in Arial', () => {
    const svg = draw()
    const labels = Array.from(svg.querySelectorAll('.group-label'))
    expect(labels).toHaveLength(3)
    labels.forEach((t) => {
      expect(t.getAttribute('text-anchor')).toBe('end')
      expect(t.getAttribute('font-family')).toBe('Arial, sans-serif')
      expect(Number(t.getAttribute('x'))).toBeLessThan(0)
    })
  })

  test('draws no group names when no group is assigned', () => {
    const data = [1, 2, 3, 4].map((value) => ({ group: undefined, value }))
    const svg = draw(data, {}, { value: { value: 'temp' } })
    expect(svg.querySelectorAll('.ridge')).toHaveLength(1)
    expect(svg.querySelectorAll('.group-label')).toHaveLength(0)
    const emptyGroup = draw(
      data,
      {},
      { ...groupedMapping, group: { value: undefined } }
    )
    expect(emptyGroup.querySelectorAll('.group-label')).toHaveLength(0)
  })

  test('draws a bottom x axis in Arial', () => {
    const svg = draw()
    expect(svg.querySelectorAll('#xAxis .tick').length).toBeGreaterThan(2)
    expect(svg.querySelector('#xAxis').getAttribute('font-family')).toBe(
      'Arial, sans-serif'
    )
  })

  test('applies fill opacity and outline color', () => {
    const svg = draw(items, { fillOpacity: 0.3, strokeColor: '#123456' })
    svg.querySelectorAll('.ridge').forEach((p) => {
      expect(p.getAttribute('fill-opacity')).toBe('0.3')
      expect(p.getAttribute('stroke')).toBe('#123456')
    })
    expect(draw().querySelector('.ridge').getAttribute('stroke')).toBe(
      '#ffffff'
    )
  })

  test('sorts the groups', () => {
    expect(labelTexts(draw(items, { sortGroupsBy: 'name' }))).toEqual([
      'Cold',
      'Mild',
      'Wide',
    ])
    const shuffled = [
      ...items.filter((d) => d.group === 'Wide'),
      ...items.filter((d) => d.group === 'Cold'),
      ...items.filter((d) => d.group === 'Mild'),
    ]
    expect(labelTexts(draw(shuffled))).toEqual(['Wide', 'Cold', 'Mild'])
    expect(labelTexts(draw(shuffled, { sortGroupsBy: 'name' }))).toEqual([
      'Cold',
      'Mild',
      'Wide',
    ])
    // medians: Cold 10, Mild 20, Wide 30
    expect(
      labelTexts(draw(shuffled, { sortGroupsBy: 'medianAscending' }))
    ).toEqual(['Cold', 'Mild', 'Wide'])
    expect(
      labelTexts(draw(shuffled, { sortGroupsBy: 'medianDescending' }))
    ).toEqual(['Wide', 'Mild', 'Cold'])
  })

  test('formats date groups as in the input', () => {
    const data = [
      { group: new Date(2020, 0, 5), value: 1 },
      { group: new Date(2020, 0, 5), value: 2 },
      { group: new Date(2020, 1, 20), value: 3 },
    ]
    const mapping = {
      value: { value: 'temp' },
      group: {
        value: 'day',
        dataType: { type: 'date', dateFormat: 'YYYY-MM-DD' },
      },
    }
    const svg = draw(data, {}, mapping)
    expect(labelTexts(svg)).toEqual(['2020-01-05', '2020-02-20'])
    const monthly = draw(
      data,
      {},
      {
        ...mapping,
        group: {
          ...mapping.group,
          dataType: { type: 'date', dateFormat: 'YYYY-MM' },
        },
      }
    )
    expect(labelTexts(monthly)).toEqual(['2020-01', '2020-02'])
  })

  test('draws numeric groups as text', () => {
    const data = [1, 2, 3].map((value) => ({ group: 2000, value }))
    expect(
      labelTexts(
        draw(
          data,
          {},
          {
            ...groupedMapping,
            group: { value: 'year', dataType: { type: 'number' } },
          }
        )
      )
    ).toEqual(['2000'])
  })

  test('a single value does not break the drawing', () => {
    const svg = draw([{ group: 'A', value: 5 }])
    const d = svg.querySelector('.ridge').getAttribute('d')
    expect(d).not.toMatch(/NaN/)
  })

  test('throws readable errors for invalid input', () => {
    expect(() => draw([{ group: 'A', value: 'warm' }])).toThrow(
      /only numbers.*"warm"/
    )
    expect(() => draw([{ group: 'A', value: NaN }])).toThrow(/only numbers/)
    expect(() => draw(items, { samples: 1 })).toThrow(/at least 2 points/)
    expect(() => draw(items, { samples: 1.5 })).toThrow(/at least 2 points/)
    expect(() => draw(items, { samples: NaN })).toThrow(/at least 2 points/)
    expect(() => draw(items, { overlap: 0 })).toThrow(/overlap/)
    expect(() => draw(items, { overlap: -1 })).toThrow(/overlap/)
    expect(() => draw(items, { bandwidth: -1 })).toThrow(/bandwidth/)
    expect(() => draw(items, { marginLeft: 600 })).toThrow(/too small/)
    expect(() => draw(items, { marginTop: 200, marginBottom: 200 })).toThrow(
      /too small/
    )
    expect(() => draw(items, { sortGroupsBy: 'size' })).toThrow(
      /Unknown sort order/
    )
    expect(() => draw(items, { curveType: 'step' })).toThrow(
      /Unknown curve type/
    )
  })

  test('re-rendering replaces the previous drawing', () => {
    const svg = draw()
    render(svg, items, baseOptions, groupedMapping, [], {})
    expect(svg.querySelectorAll('#background')).toHaveLength(1)
    expect(svg.querySelectorAll('#viz')).toHaveLength(1)
    expect(svg.querySelectorAll('.ridge')).toHaveLength(3)
  })
})
