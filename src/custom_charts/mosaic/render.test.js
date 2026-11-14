import * as d3 from 'd3'
import { visualOptions as optionDefinitions } from './visualOptions'
import { mapData, dimensions } from './mapping'
import render from './render'

const SVG_NS = 'http://www.w3.org/2000/svg'

const defaults = Object.fromEntries(
  Object.entries(optionDefinitions).map(([key, def]) => [key, def.default])
)

// class x sex x survival, like the Titanic sample
const rows = [
  { cls: '1st', sex: 'M', survived: 'no', n: 30 },
  { cls: '1st', sex: 'F', survived: 'no', n: 10 },
  { cls: '1st', sex: 'M', survived: 'yes', n: 20 },
  { cls: '1st', sex: 'F', survived: 'yes', n: 40 },
  { cls: '2nd', sex: 'M', survived: 'no', n: 50 },
  { cls: '2nd', sex: 'F', survived: 'yes', n: 50 },
]

// the color scale the core builds for an ordinal dimension: its domain holds
// the distinct values of the color, sorted by name
function ordinalScale(mapped) {
  const domain = Array.from(new Set(mapped.map((d) => d.color))).sort()
  return d3
    .scaleOrdinal()
    .domain(domain)
    .range(['#111111', '#222222', '#333333', '#444444'])
    .unknown('#cccccc')
}

function draw(colorColumn, options = {}) {
  const mapping = {
    column: { value: 'cls' },
    row: { value: 'survived' },
    size: { value: 'n' },
    color: { value: colorColumn },
  }
  const mapped = mapData(rows, mapping, {}, dimensions)
  const svg = document.createElementNS(SVG_NS, 'svg')
  render(
    svg,
    mapped,
    {
      ...defaults,
      width: 440,
      height: 220,
      marginTop: 10,
      marginRight: 0,
      marginBottom: 10,
      marginLeft: 40,
      padding: 0,
      color: ordinalScale(mapped),
      ...options,
    },
    mapping,
    rows,
    {}
  )
  return svg
}

const segments = (svg) =>
  Array.from(svg.querySelectorAll('rect')).map((rect) => ({
    title: rect.querySelector('title').textContent.split('\n')[0],
    size: Number(rect.querySelector('title').textContent.split('Size: ')[1]),
    fill: rect.getAttribute('fill'),
    x: Number(rect.getAttribute('x')),
    y: Number(rect.getAttribute('y')),
    width: Number(rect.getAttribute('width')),
    height: Number(rect.getAttribute('height')),
  }))

describe('Mekko chart render: colors', () => {
  test('without a color column, the segments are colored by row', () => {
    const items = segments(draw(undefined))
    expect(items.map((d) => d.title)).toEqual([
      '1st / no',
      '1st / yes',
      '2nd / no',
      '2nd / yes',
    ])
    // "no" and "yes" get the first two colors of the scale, in every column
    expect(items.map((d) => d.fill)).toEqual([
      '#111111',
      '#222222',
      '#111111',
      '#222222',
    ])
  })

  test('a color column equal to the row gives the same picture', () => {
    const byRow = segments(draw('survived'))
    const unmapped = segments(draw(undefined))
    expect(byRow).toEqual(unmapped)
  })

  test('a color column equal to the column colors each column', () => {
    const items = segments(draw('cls'))
    expect(items.map((d) => [d.title, d.fill])).toEqual([
      ['1st / no', '#111111'],
      ['1st / yes', '#111111'],
      ['2nd / no', '#222222'],
      ['2nd / yes', '#222222'],
    ])
  })

  test('another color column splits each segment by its values', () => {
    const items = segments(draw('sex'))
    // F is #111111 and M is #222222; parts follow the order of the scale
    expect(items.map((d) => [d.title, d.size, d.fill])).toEqual([
      ['1st / no / F', 10, '#111111'],
      ['1st / no / M', 30, '#222222'],
      ['1st / yes / F', 40, '#111111'],
      ['1st / yes / M', 20, '#222222'],
      ['2nd / no / M', 50, '#222222'],
      ['2nd / yes / F', 50, '#111111'],
    ])
  })

  test('the parts of a segment fill exactly the height of the segment', () => {
    const chartHeight = 200
    const split = segments(draw('sex'))
    const whole = segments(draw('survived'))

    const first = whole.find((d) => d.title === '1st / no')
    const parts = split.filter((d) => d.title.startsWith('1st / no'))
    expect(parts).toHaveLength(2)
    expect(d3.sum(parts, (d) => d.height)).toBeCloseTo(first.height, 6)
    // heights follow the shares 10 : 30
    expect(parts[0].height / parts[1].height).toBeCloseTo(10 / 30, 6)
    // stacked from the bottom of the segment, without gaps
    expect(parts[0].y + parts[0].height).toBeCloseTo(first.y + first.height, 6)
    expect(parts[1].y + parts[1].height).toBeCloseTo(parts[0].y, 6)
    expect(parts[1].y).toBeCloseTo(first.y, 6)
    // every column is as high as the chart
    const column = split.filter((d) => d.title.startsWith('1st'))
    expect(d3.sum(column, (d) => d.height)).toBeCloseTo(chartHeight, 6)
    // the width of the columns is not affected by the split
    expect(new Set(column.map((d) => d.width)).size).toBe(1)
    expect(column[0].width).toBeCloseTo(first.width, 6)
  })

  test('values that the scale does not list keep the default color', () => {
    const svg = draw('sex', {
      color: d3.scaleOrdinal().domain(['F']).range(['#111111']).unknown('#cccccc'),
    })
    const fills = segments(svg).map((d) => d.fill)
    expect(new Set(fills)).toEqual(new Set(['#111111', '#cccccc']))
  })
})

describe('Mekko chart render: rows when the color is another column', () => {
  const rowLabels = (svg) =>
    Array.from(svg.querySelectorAll('text.rowlabel')).map((t) => t.textContent)

  test('rows are not marked when the color is the row', () => {
    for (const column of [undefined, 'survived']) {
      const svg = draw(column)
      expect(svg.querySelector('#row-separators')).toBeNull()
      expect(rowLabels(svg)).toEqual([])
    }
  })

  test('rows are separated and named when the color is another column', () => {
    for (const column of ['sex', 'cls']) {
      const svg = draw(column, { autoHideLabels: false })
      // one line between the two rows of each column
      expect(svg.querySelectorAll('#row-separators line')).toHaveLength(2)
      expect(rowLabels(svg)).toEqual(['no', 'yes', 'no', 'yes'])
    }
  })

  test('the separator sits on the boundary between the rows', () => {
    const svg = draw('sex')
    const whole = segments(draw('survived'))
    const boundary = whole.find((d) => d.title === '1st / no').y
    const line = svg.querySelector('#row-separators line')
    expect(Number(line.getAttribute('y1'))).toBeCloseTo(boundary, 6)
    expect(Number(line.getAttribute('y2'))).toBeCloseTo(boundary, 6)
  })

  test('row names follow the "Show labels" option', () => {
    const svg = draw('sex', { showLabels: false })
    expect(rowLabels(svg)).toEqual([])
    expect(svg.querySelectorAll('#row-separators line')).toHaveLength(2)
  })
})
