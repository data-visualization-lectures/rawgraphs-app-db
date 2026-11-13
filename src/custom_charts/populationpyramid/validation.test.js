import { buildPyramid } from './mapping'

describe('Population pyramid value validation', () => {
  test('an empty cell (null) counts as 0', () => {
    const result = buildPyramid([
      { category: '0-4', side: 'Male', value: null },
      { category: '0-4', side: 'Female', value: 5 },
    ])
    expect(result.categories).toEqual([{ category: '0-4', left: 0, right: 5 }])
  })
})
