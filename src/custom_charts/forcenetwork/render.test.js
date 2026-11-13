import { visualOptions as optionDefinitions } from './visualOptions'
import render from './render'

const SVG_NS = 'http://www.w3.org/2000/svg'

// default values of the options, plus the ones added by the core
const defaults = Object.fromEntries(
  Object.entries(optionDefinitions).map(([key, def]) => [key, def.default])
)
const baseOptions = {
  ...defaults,
  width: 600,
  height: 400,
  background: '#ffffff',
}

// two triangles joined by one link, plus a leaf
const edges = [
  { source: 'A', target: 'B', value: 1 },
  { source: 'B', target: 'C', value: 2 },
  { source: 'C', target: 'A', value: 3 },
  { source: 'C', target: 'D', value: 4 },
  { source: 'D', target: 'E', value: 5 },
  { source: 'E', target: 'F', value: 6 },
  { source: 'F', target: 'D', value: 7 },
  { source: 'F', target: 'G', value: 8 },
]

function draw(data, options = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg')
  render(svg, data, { ...baseOptions, ...options }, {}, data, {})
  return svg
}

const num = (el, name) => Number(el.getAttribute(name))

describe('Network graph render', () => {
  test('draws the background first and the chart in #viz', () => {
    const svg = draw(edges)
    const first = svg.firstElementChild
    expect(first.tagName).toBe('rect')
    expect(first.getAttribute('id')).toBe('background')
    expect(first.getAttribute('fill')).toBe('#ffffff')
    expect(first.getAttribute('width')).toBe('600')
    expect(first.getAttribute('height')).toBe('400')
    const viz = svg.querySelector('g#viz')
    expect(viz).not.toBeNull()
    expect(viz.getAttribute('transform')).toBe('translate(20,20)')
  })

  test('draws one circle per node and one line per link, links first', () => {
    const svg = draw(edges)
    expect(svg.querySelectorAll('circle.node')).toHaveLength(7)
    expect(svg.querySelectorAll('line.link')).toHaveLength(8)
    expect(svg.querySelectorAll('text.label')).toHaveLength(7)

    const all = Array.from(svg.querySelectorAll('line.link, circle.node'))
    const lastLink = all.map((e) => e.tagName).lastIndexOf('line')
    const firstNode = all.map((e) => e.tagName).indexOf('circle')
    expect(lastLink).toBeLessThan(firstNode)
  })

  test('labels are on the right of the nodes with the requested style', () => {
    const svg = draw(edges, { labelFontSize: 12 })
    const circles = svg.querySelectorAll('circle.node')
    const labels = svg.querySelectorAll('text.label')
    labels.forEach((label, i) => {
      expect(num(label, 'x')).toBeCloseTo(
        num(circles[i], 'cx') + num(circles[i], 'r') + 4
      )
      expect(num(label, 'y')).toBeCloseTo(num(circles[i], 'cy'))
      expect(label.getAttribute('font-family')).toBe('Arial, sans-serif')
      expect(label.getAttribute('font-size')).toBe('12')
    })
    expect(Array.from(labels).map((l) => l.textContent)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
    ])
  })

  test('hides labels when showLabels is false', () => {
    const svg = draw(edges, { showLabels: false })
    expect(svg.querySelectorAll('text')).toHaveLength(0)
    expect(svg.querySelectorAll('circle.node')).toHaveLength(7)
  })

  test('every circle fits in the drawing area, whatever the artboard shape', () => {
    const cases = [
      {},
      { width: 900, height: 200 },
      { width: 200, height: 700 },
      { marginTop: 50, marginLeft: 80, marginRight: 30, marginBottom: 10 },
      { showLabels: false },
    ]
    cases.forEach((options) => {
      const o = { ...baseOptions, ...options }
      const svg = draw(edges, options)
      const chartWidth = o.width - o.marginLeft - o.marginRight
      const chartHeight = o.height - o.marginTop - o.marginBottom
      const eps = 1e-6
      svg.querySelectorAll('circle.node').forEach((c) => {
        const cx = num(c, 'cx')
        const cy = num(c, 'cy')
        const r = num(c, 'r')
        expect(cx - r).toBeGreaterThanOrEqual(-eps)
        expect(cx + r).toBeLessThanOrEqual(chartWidth + eps)
        expect(cy - r).toBeGreaterThanOrEqual(-eps)
        expect(cy + r).toBeLessThanOrEqual(chartHeight + eps)
      })
    })
  })

  test('the labels also fit in the drawing area on the right', () => {
    const o = baseOptions
    const chartWidth = o.width - o.marginLeft - o.marginRight
    const svg = draw(edges)
    svg.querySelectorAll('text.label').forEach((t) => {
      // single character labels: 0.6 em wide
      expect(num(t, 'x') + 0.6 * o.labelFontSize).toBeLessThanOrEqual(
        chartWidth + 1e-6
      )
    })
  })

  test('the layout touches the drawing area so that it is as large as possible', () => {
    const svg = draw(edges, { showLabels: false })
    const circles = Array.from(svg.querySelectorAll('circle.node'))
    const left = Math.min(...circles.map((c) => num(c, 'cx') - num(c, 'r')))
    const right = Math.max(...circles.map((c) => num(c, 'cx') + num(c, 'r')))
    const top = Math.min(...circles.map((c) => num(c, 'cy') - num(c, 'r')))
    const bottom = Math.max(...circles.map((c) => num(c, 'cy') + num(c, 'r')))
    // centered, and at least one axis is completely filled
    const slackX = 560 - (right - left)
    const slackY = 360 - (bottom - top)
    expect(left).toBeCloseTo(slackX / 2, 3)
    expect(top).toBeCloseTo(slackY / 2, 3)
    expect(Math.min(slackX, slackY)).toBeCloseTo(0, 3)
  })

  test('the same input gives the same layout every time', () => {
    const positions = (svg) =>
      Array.from(svg.querySelectorAll('circle.node')).map((c) => [
        c.getAttribute('cx'),
        c.getAttribute('cy'),
        c.getAttribute('r'),
      ])
    const first = positions(draw(edges))
    const second = positions(draw(edges))
    expect(second).toEqual(first)
    expect(new Set(first.map((p) => p.join())).size).toBe(7)
  })

  test('rendering twice on the same svg replaces the previous drawing', () => {
    const svg = document.createElementNS(SVG_NS, 'svg')
    render(svg, edges, baseOptions, {}, edges, {})
    render(svg, edges, baseOptions, {}, edges, {})
    expect(svg.querySelectorAll('#background')).toHaveLength(1)
    expect(svg.querySelectorAll('circle.node')).toHaveLength(7)
  })

  test('connected nodes are closer than unconnected ones', () => {
    const svg = draw(edges, { showLabels: false })
    const c = Array.from(svg.querySelectorAll('circle.node')).map((e) => [
      num(e, 'cx'),
      num(e, 'cy'),
    ])
    const dist = (i, j) => Math.hypot(c[i][0] - c[j][0], c[i][1] - c[j][1])
    // A-B-C triangle versus A and G (opposite ends)
    expect(dist(0, 1)).toBeLessThan(dist(0, 6))
    expect(dist(0, 2)).toBeLessThan(dist(0, 6))
  })

  test('link width goes from minLinkWidth to maxLinkWidth', () => {
    const svg = draw(edges, { minLinkWidth: 2, maxLinkWidth: 10 })
    const widths = Array.from(svg.querySelectorAll('line.link')).map((l) =>
      num(l, 'stroke-width')
    )
    expect(widths[0]).toBeCloseTo(2)
    expect(widths[widths.length - 1]).toBeCloseTo(10)
    expect(widths[1]).toBeGreaterThan(widths[0])
  })

  test('link width is minLinkWidth when all values are equal', () => {
    const same = edges.map((e) => ({ ...e, value: 3 }))
    const svg = draw(same, { minLinkWidth: 2, maxLinkWidth: 10 })
    svg.querySelectorAll('line.link').forEach((l) => {
      expect(l.getAttribute('stroke-width')).toBe('2')
    })
  })

  test('applies colors and link opacity', () => {
    const svg = draw(edges, {
      nodeColor: '#112233',
      linkColor: '#445566',
      linkOpacity: 0.3,
    })
    expect(svg.querySelector('circle.node').getAttribute('fill')).toBe(
      '#112233'
    )
    const link = svg.querySelector('line.link')
    expect(link.getAttribute('stroke')).toBe('#445566')
    expect(link.getAttribute('stroke-opacity')).toBe('0.3')
  })

  test('node diameter follows the selected measure', () => {
    const same = draw(edges, {
      nodeSize: 'default',
      minDiameter: 4,
      maxDiameter: 30,
    })
    same.querySelectorAll('circle.node').forEach((c) => {
      expect(num(c, 'r')).toBeCloseTo(15)
    })

    const byValue = draw(edges, { nodeSize: 'totalValue' })
    const radii = Array.from(byValue.querySelectorAll('circle.node')).map((c) =>
      num(c, 'r')
    )
    // F has the largest total value (6 + 7 + 8), A the smallest (1 + 3)
    expect(Math.max(...radii)).toBeCloseTo(15)
    expect(radii[5]).toBeCloseTo(15)
    expect(radii[0]).toBeLessThan(radii[5])
    expect(Math.min(...radii)).toBeGreaterThanOrEqual(2)
  })

  test('draws only the background when there is no data', () => {
    const svg = draw([])
    expect(svg.children).toHaveLength(1)
    expect(svg.firstElementChild.getAttribute('id')).toBe('background')
  })

  test('a single node is drawn in the middle', () => {
    const svg = draw([{ source: 'A', target: 'A', value: 1 }], {
      showLabels: false,
    })
    const circles = svg.querySelectorAll('circle.node')
    expect(circles).toHaveLength(1)
    expect(svg.querySelectorAll('line.link')).toHaveLength(0)
    expect(num(circles[0], 'cx')).toBeCloseTo(280)
    expect(num(circles[0], 'cy')).toBeCloseTo(180)
  })

  test('two nodes on a single link are drawn', () => {
    const svg = draw([{ source: 'A', target: 'B', value: 1 }])
    expect(svg.querySelectorAll('circle.node')).toHaveLength(2)
    expect(svg.querySelectorAll('line.link')).toHaveLength(1)
  })

  test('the same node given as equal dates is a single node', () => {
    const rows = [
      {
        source: new Date('2020-01-01'),
        target: new Date('2020-02-01'),
        value: 1,
      },
      {
        source: new Date('2020-02-01'),
        target: new Date('2020-03-01'),
        value: 1,
      },
    ]
    const svg = draw(rows)
    expect(svg.querySelectorAll('circle.node')).toHaveLength(3)
  })

  test('throws readable errors for options that cannot be drawn', () => {
    expect(() => draw(edges, { minDiameter: 20, maxDiameter: 10 })).toThrow(
      'Max diameter must not be smaller than min diameter.'
    )
    expect(() => draw(edges, { minLinkWidth: 5, maxLinkWidth: 1 })).toThrow(
      'Max link width must not be smaller than min link width.'
    )
    expect(() => draw(edges, { iterations: -1 })).toThrow(
      'Simulation steps must be a number greater than or equal to 0.'
    )
    expect(() => draw(edges, { nodeSize: 'unknown' })).toThrow(
      'The selected node diameter option is not available.'
    )
  })
})
