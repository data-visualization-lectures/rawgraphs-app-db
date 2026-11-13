import { mapData, computePareto, dimensions } from './mapping'

describe('Pareto chart data mapping', () => {
    const dataTypes = {
        cause: 'string',
        count: 'number',
    }

    const rows = [
        { cause: 'A', count: 5 },
        { cause: 'B', count: 30 },
        { cause: 'A', count: 10 },
        { cause: 'C', count: 20 },
        { cause: 'B', count: 5 },
    ]

    test('aggregates by category and sorts by value descending', () => {
        const mapping = {
            category: { value: 'cause' },
            value: { value: 'count', config: { aggregation: 'sum' } },
        }
        const result = mapData(rows, mapping, dataTypes, dimensions)
        expect(result).toEqual([
            { category: 'B', value: 35 },
            { category: 'C', value: 20 },
            { category: 'A', value: 15 },
        ])
    })

    test('uses the aggregation chosen for the value', () => {
        const mapping = {
            category: { value: 'cause' },
            value: { value: 'count', config: { aggregation: 'max' } },
        }
        const result = mapData(rows, mapping, dataTypes, dimensions)
        expect(result).toEqual([
            { category: 'B', value: 30 },
            { category: 'C', value: 20 },
            { category: 'A', value: 10 },
        ])
    })

    test('sums by default when the value has no explicit aggregation', () => {
        const mapping = {
            category: { value: 'cause' },
            value: { value: 'count' },
        }
        const result = mapData(rows, mapping, dataTypes, dimensions)
        expect(result[0]).toEqual({ category: 'B', value: 35 })
    })

    test('counts rows when the value is not mapped', () => {
        const mapping = { category: { value: 'cause' } }
        const result = mapData(rows, mapping, dataTypes, dimensions)
        expect(mapping.value).toEqual({ value: undefined })
        expect(result).toEqual([
            { category: 'A', value: 2 },
            { category: 'B', value: 2 },
            { category: 'C', value: 1 },
        ])
    })

    test('counts rows when the value is mapped to undefined', () => {
        const mapping = {
            category: { value: 'cause' },
            value: { value: undefined },
        }
        const result = mapData(rows, mapping, dataTypes, dimensions)
        expect(result.map((d) => d.value)).toEqual([2, 2, 1])
    })

    test('formats date categories with the detected date format', () => {
        const dates = [
            { day: new Date(2020, 0, 5), n: 1 },
            { day: new Date(2020, 0, 5), n: 2 },
            { day: new Date(2020, 0, 6), n: 10 },
        ]
        const mapping = {
            category: { value: 'day' },
            value: { value: 'n', config: { aggregation: 'sum' } },
        }
        const result = mapData(
            dates,
            mapping,
            { day: { type: 'date', dateFormat: 'YYYY-MM-DD' }, n: 'number' },
            dimensions
        )
        expect(result).toEqual([
            { category: '2020-01-06', value: 10 },
            { category: '2020-01-05', value: 3 },
        ])
    })

    test('returns an empty array for empty data', () => {
        const mapping = { category: { value: 'cause' } }
        expect(mapData([], mapping, dataTypes, dimensions)).toEqual([])
    })
})

describe('computePareto', () => {
    const items = [
        { category: 'a', value: 50 },
        { category: 'b', value: 30 },
        { category: 'c', value: 15 },
        { category: 'd', value: 5 },
    ]
    const options = { maxCategories: 0, othersLabel: 'Others' }

    test('adds the cumulative share, ending at exactly 1', () => {
        const result = computePareto(items, options)
        expect(result.map((d) => d.category)).toEqual(['a', 'b', 'c', 'd'])
        expect(result.map((d) => d.cumulative)).toEqual([0.5, 0.8, 0.95, 1])
    })

    test('does not modify its input', () => {
        const copy = JSON.parse(JSON.stringify(items))
        computePareto(items, { maxCategories: 2, othersLabel: 'Others' })
        expect(items).toEqual(copy)
    })

    test('merges the rest into one item when there are more than maxCategories', () => {
        const result = computePareto(items, {
            maxCategories: 2,
            othersLabel: 'Others',
        })
        expect(result).toEqual([
            { category: 'a', value: 50, cumulative: 0.5 },
            { category: 'b', value: 30, cumulative: 0.8 },
            { category: 'Others', value: 20, cumulative: 1 },
        ])
    })

    test('uses the given othersLabel', () => {
        const result = computePareto(items, {
            maxCategories: 1,
            othersLabel: 'その他',
        })
        expect(result[result.length - 1].category).toBe('その他')
        expect(result[result.length - 1].value).toBe(50)
    })

    test('keeps all items when the count does not exceed maxCategories', () => {
        expect(
            computePareto(items, { maxCategories: 4, othersLabel: 'Others' })
        ).toHaveLength(4)
        expect(
            computePareto(items, { maxCategories: 10, othersLabel: 'Others' })
        ).toHaveLength(4)
    })

    test('treats maxCategories below 1 as "all"', () => {
        expect(
            computePareto(items, { maxCategories: 0, othersLabel: 'Others' })
        ).toHaveLength(4)
        expect(
            computePareto(items, { maxCategories: -3, othersLabel: 'Others' })
        ).toHaveLength(4)
    })

    test('throws when the total is 0 or less', () => {
        expect(() =>
            computePareto([{ category: 'a', value: 0 }], options)
        ).toThrow(Error)
        expect(() =>
            computePareto([{ category: 'a', value: -5 }], options)
        ).toThrow(Error)
        expect(() => computePareto([], options)).toThrow(Error)
    })
})
