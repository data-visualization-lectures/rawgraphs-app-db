import { visualOptions as optionDefinitions } from './visualOptions'
import render from './render'

const defaults = Object.fromEntries(
  Object.entries(optionDefinitions).map(([key, def]) => [key, def.default])
)
const baseOptions = {
  ...defaults,
  width: 600,
  height: 400,
  background: '#ffffff',
}

function draw(data, options = {}, mapping = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  render(svg, data, { ...baseOptions, ...options }, mapping, data, {})
  return svg
}

describe('Network graph input validation', () => {
  test('an empty cell (null) counts as 0', () => {
    const svg = draw([
      { source: 'A', target: 'B', value: null },
      { source: 'B', target: 'C', value: 2 },
    ])
    expect(svg.querySelectorAll('circle.node')).toHaveLength(3)
    svg.querySelectorAll('circle.node').forEach((node) => {
      expect(Number(node.getAttribute('r'))).toBeGreaterThan(0)
    })
  })

  test('negative sizes are rejected', () => {
    expect(() => draw([{ source: 'A', target: 'B', value: -5 }])).toThrow(
      /negative/
    )
  })

  test('sizes that are not numbers are rejected', () => {
    expect(() => draw([{ source: 'A', target: 'B', value: undefined }])).toThrow(
      /only numbers/
    )
  })

  test('margins larger than the artboard are rejected', () => {
    expect(() =>
      draw([{ source: 'A', target: 'B', value: 1 }], {
        marginLeft: 400,
        marginRight: 300,
      })
    ).toThrow(/Margins/)
  })

  test('date nodes are labelled in the format of the dataset', () => {
    const mapping = {
      source: { dataType: { type: 'date', dateFormat: 'YYYY-MM-DD' } },
      target: { dataType: 'string' },
    }
    const svg = draw(
      [{ source: new Date(2020, 0, 1), target: 'B', value: 1 }],
      {},
      mapping
    )
    const labels = Array.from(svg.querySelectorAll('text.label')).map(
      (d) => d.textContent
    )
    expect(labels).toContain('2020-01-01')
  })
})
