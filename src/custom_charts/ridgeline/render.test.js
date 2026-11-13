import * as d3 from 'd3'
import render from './render'
import { silvermanBandwidth, kernelDensity } from './mapping'
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

  // number of points of the first curve (the top line and the baseline have the same count)
  const pointsOf = (svg) =>
    numbersOf(svg.querySelector('.ridge').getAttribute('d')).length / 4

  test('the curve has one point per sample when the bandwidth is large enough', () => {
    // bandwidth 1000: the x domain is about 6000 wide, 13 points are enough
    // for a gap of half a bandwidth
    const svg = draw(items, {
      curveType: 'linear',
      samples: 20,
      bandwidth: 1000,
    })
    expect(pointsOf(svg)).toBe(20)
  })

  test('uses more points than samples when the bandwidth is small, and never fewer', () => {
    // values 8..50, bandwidth 0.1: domain 42.6 wide, gaps of at most 0.05
    // need 2 * 42.6 / 0.1 + 1 = 853 points
    const fine = draw(items, {
      curveType: 'linear',
      samples: 100,
      bandwidth: 0.1,
    })
    expect(pointsOf(fine)).toBe(853)
    // more samples than needed: samples is the minimum
    const many = draw(items, {
      curveType: 'linear',
      samples: 1000,
      bandwidth: 0.1,
    })
    expect(pointsOf(many)).toBe(1000)
  })

  test('the number of points is limited to 2000', () => {
    const svg = draw(items, {
      curveType: 'linear',
      samples: 100,
      bandwidth: 0.001,
    })
    expect(pointsOf(svg)).toBe(2000)
  })

  test('with a small bandwidth the height of a curve follows the maximum of the density', () => {
    // each group has its peak at a different place between the points of a
    // 100 point grid; D has two values, so its maximum is half of the others
    const groupValues = {
      A: [5.037],
      B: [14.3],
      C: [23.77],
      D: [31.9, 38.2],
    }
    const data = Object.keys(groupValues).flatMap((group) =>
      groupValues[group].map((value) => ({ group, value }))
    )
    const bandwidth = 0.1
    const svg = draw(data, { curveType: 'linear', bandwidth, samples: 100 })
    const ys = labelY(svg)
    const heights = Array.from(svg.querySelectorAll('.ridge')).map(
      (p, i) => ys[i] - Math.min(...yOf(p.getAttribute('d')))
    )
    // maximum of the density on a very fine grid
    const fineXs = d3.range(0, 45, 0.001)
    const maxima = Object.values(groupValues).map((values) =>
      d3.max(kernelDensity(values, fineXs, bandwidth))
    )
    // sameScale is on: the highest density is overlap * step high, the others in proportion
    const tallest = 1.5 * (330 / (3 + 1.5))
    // points half a bandwidth apart can miss a peak by up to 3%
    heights.forEach((height, i) =>
      expect(height / tallest).toBeCloseTo(maxima[i] / d3.max(maxima), 1)
    )
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

  const paths = (svg) =>
    Array.from(svg.querySelectorAll('.ridge')).map((p) => p.getAttribute('d'))
  const valuesOf = (group) =>
    items.filter((d) => d.group === group).map((d) => d.value)

  test('bandwidth 0 uses the median of the Silverman bandwidths of the groups', () => {
    // Cold and Mild have the same spread, Wide is much wider: the median is the narrow one
    const cold = silvermanBandwidth(valuesOf('Cold'))
    const wide = silvermanBandwidth(valuesOf('Wide'))
    expect(wide).toBeGreaterThan(cold * 2)
    const auto = draw(items)
    expect(paths(auto)).toEqual(paths(draw(items, { bandwidth: cold })))
    expect(paths(auto)).not.toEqual(
      paths(
        draw(items, {
          bandwidth: silvermanBandwidth(items.map((d) => d.value)),
        })
      )
    )
    expect(paths(draw(items, { bandwidth: 1 }))).not.toEqual(paths(auto))
  })

  test('the automatic bandwidth does not include the distance between the groups', () => {
    // A spans 0..4 and B spans 1000..1004: each is as wide as 5 neighbouring values
    const far = [
      ...[0, 1, 2, 3, 4].map((value) => ({ group: 'A', value })),
      ...[1000, 1001, 1002, 1003, 1004].map((value) => ({ group: 'B', value })),
    ]
    const h = silvermanBandwidth([0, 1, 2, 3, 4])
    expect(h).toBeLessThan(1)
    const auto = draw(far)
    expect(paths(auto)).toEqual(paths(draw(far, { bandwidth: h })))
    // the x axis goes from 0 - 3h to 1004 + 3h
    const ticks = Array.from(auto.querySelectorAll('#xAxis .tick'))
    expect(ticks[0].textContent).toBe('0')
    expect(ticks[ticks.length - 1].textContent).toBe('1,000')
  })

  test('groups without spread are left out of the automatic bandwidth', () => {
    // Flat has one value only, so its bandwidth is 0 and does not count
    const withFlat = [
      ...items.filter((d) => d.group !== 'Mild'),
      { group: 'Flat', value: 30 },
    ]
    const expected =
      (silvermanBandwidth(valuesOf('Cold')) +
        silvermanBandwidth(valuesOf('Wide'))) /
      2
    expect(paths(draw(withFlat))).toEqual(
      paths(draw(withFlat, { bandwidth: expected }))
    )
  })

  test('without a group the bandwidth is the one of all the values', () => {
    const values = [1, 2, 3, 4, 5, 9]
    const data = values.map((value) => ({ group: undefined, value }))
    const mapping = { value: { value: 'temp' } }
    expect(paths(draw(data, {}, mapping))).toEqual(
      paths(draw(data, { bandwidth: silvermanBandwidth(values) }, mapping))
    )
  })

  test('when no group has a spread, the bandwidth is 1/20 of the range of the values', () => {
    const flat = [
      ...[10, 10, 10].map((value) => ({ group: 'A', value })),
      ...[20, 20, 20].map((value) => ({ group: 'B', value })),
    ]
    expect(paths(draw(flat))).toEqual(paths(draw(flat, { bandwidth: 0.5 })))
    // one value per group
    const single = [
      { group: 'A', value: 100 },
      { group: 'B', value: 300 },
    ]
    expect(paths(draw(single))).toEqual(paths(draw(single, { bandwidth: 10 })))
  })

  test('when all the values are equal the x range does not depend on their size', () => {
    // no spread and no range: the bandwidth is 1, the x domain is value +- 3
    const domainOf = (value) => {
      const data = [value, value, value].map((v) => ({ group: 'A', value: v }))
      const svg = draw(data)
      const ticks = Array.from(svg.querySelectorAll('#xAxis .tick')).map((t) =>
        Number(t.textContent.replace('−', '-').replace(',', ''))
      )
      return {
        svg,
        first: ticks[0] - value,
        last: ticks[ticks.length - 1] - value,
      }
    }
    const big = domainOf(1000)
    const zero = domainOf(0)
    const negative = domainOf(-50000)
    ;[big, zero, negative].forEach((r) => {
      expect(r.first).toBe(-3)
      expect(r.last).toBe(3)
      expect(paths(r.svg)[0]).not.toMatch(/NaN/)
    })
    // and the curves have the same shape (the x coordinates are shifted by rounding only)
    const bigY = yOf(paths(big.svg)[0])
    const zeroY = yOf(paths(zero.svg)[0])
    expect(bigY).toHaveLength(zeroY.length)
    bigY.forEach((y, i) => expect(y).toBeCloseTo(zeroY[i], 6))
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

  test('sorting by name puts 1月, 2月, 10月 and 9, 10, 100 in that order', () => {
    const rows = (names) =>
      names.flatMap((group) => [1, 2, 3].map((value) => ({ group, value })))
    expect(
      labelTexts(draw(rows(['10月', '2月', '1月']), { sortGroupsBy: 'name' }))
    ).toEqual(['1月', '2月', '10月'])
    expect(
      labelTexts(draw(rows([100, 9, 10]), { sortGroupsBy: 'name' }))
    ).toEqual(['9', '10', '100'])
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
