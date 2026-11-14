import { computePareto } from './mapping'

const options = { maxCategories: 0, othersLabel: 'Others' }

describe('Pareto chart value validation', () => {
  test('an empty cell (null) counts as 0', () => {
    const result = computePareto(
      [
        { category: 'A', value: 3 },
        { category: 'B', value: null },
      ],
      options
    )
    expect(result.map((d) => d.value)).toEqual([3, 0])
    expect(result[1].cumulative).toBe(1)
  })

  test('negative values are rejected', () => {
    expect(() =>
      computePareto(
        [
          { category: 'A', value: 10 },
          { category: 'B', value: -3 },
        ],
        options
      )
    ).toThrow(/negative/)
  })

  test('values that are not numbers are rejected', () => {
    expect(() =>
      computePareto([{ category: 'A', value: undefined }], options)
    ).toThrow(/needs one number/)
    expect(() =>
      computePareto([{ category: 'A', value: '1,2' }], options)
    ).toThrow(/needs one number/)
  })
})
