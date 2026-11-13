import { mapData, dimensions } from './mapping'
import { visualOptions as optionDefinitions } from './visualOptions'
import render from './render'

const defaults = Object.fromEntries(
  Object.entries(optionDefinitions).map(([key, def]) => [key, def.default])
)
const options = { ...defaults, width: 600, height: 400, background: '#ffffff' }

function draw(data) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  render(svg, data, options, {}, data, {})
  return svg
}

const labelsOf = (svg) =>
  Array.from(svg.querySelectorAll('text.label')).map((d) => d.textContent)

describe('Network graph: empty source or target cells', () => {
  test('mapData drops only the rows where both are empty', () => {
    const data = [
      { a: 'A', b: 'B' },
      { a: 'C', b: '' },
      { a: '', b: null },
    ]
    const mapping = {
      source: { value: 'a' },
      target: { value: 'b' },
      size: { value: undefined },
    }
    const dataTypes = { a: { type: 'string' }, b: { type: 'string' } }
    expect(mapData(data, mapping, dataTypes, dimensions)).toEqual([
      { source: 'A', target: 'B', value: 1 },
      { source: 'C', target: '', value: 1 },
    ])
  })

  test('a row with an empty target draws its node without a link', () => {
    const svg = draw([
      { source: 'A', target: 'B', value: 1 },
      { source: 'C', target: '', value: 1 },
      { source: null, target: 'D', value: 1 },
    ])
    expect(labelsOf(svg).sort()).toEqual(['A', 'B', 'C', 'D'])
    expect(svg.querySelectorAll('line.link')).toHaveLength(1)
    svg.querySelectorAll('circle.node').forEach((node) => {
      expect(Number.isFinite(Number(node.getAttribute('cx')))).toBe(true)
      expect(Number(node.getAttribute('r'))).toBeGreaterThan(0)
    })
  })

  test('nodes without any link are still drawn', () => {
    const svg = draw([
      { source: 'A', target: '', value: 1 },
      { source: 'B', target: '', value: 1 },
    ])
    expect(labelsOf(svg).sort()).toEqual(['A', 'B'])
    expect(svg.querySelectorAll('line.link')).toHaveLength(0)
  })
})
