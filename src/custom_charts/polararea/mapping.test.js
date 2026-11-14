import {
    mapData,
    prepareItems,
    compareCategories,
    radiusScaleFor,
    dimensions,
} from './mapping'

describe('Polar area chart data mapping', () => {
    const dataTypes = {
        month: 'string',
        visitors: 'number',
    }

    const rows = [
        { month: 'B', visitors: 30 },
        { month: 'A', visitors: 5 },
        { month: 'B', visitors: 5 },
        { month: 'C', visitors: 20 },
        { month: 'A', visitors: 10 },
    ]

    test('declares the dimensions', () => {
        expect(dimensions.map((d) => d.id)).toEqual(['category', 'value'])
        const [category, value] = dimensions
        expect(category.required).toBe(true)
        expect(category.validTypes).toEqual(['number', 'date', 'string'])
        expect(value.required).toBe(false)
        expect(value.validTypes).toEqual(['number'])
        expect(value.aggregation).toBe(true)
        expect(value.aggregationDefault).toBe('sum')
    })

    test('aggregates by category in the order of first appearance', () => {
        const mapping = {
            category: { value: 'month' },
            value: { value: 'visitors', config: { aggregation: 'sum' } },
        }
        expect(mapData(rows, mapping, dataTypes, dimensions)).toEqual([
            { category: 'B', value: 35 },
            { category: 'A', value: 15 },
            { category: 'C', value: 20 },
        ])
    })

    test('uses the aggregation chosen for the value', () => {
        const mapping = {
            category: { value: 'month' },
            value: { value: 'visitors', config: { aggregation: 'max' } },
        }
        expect(
            mapData(rows, mapping, dataTypes, dimensions).map((d) => d.value)
        ).toEqual([30, 10, 20])
    })

    test('sums by default when the value has no explicit aggregation', () => {
        const mapping = {
            category: { value: 'month' },
            value: { value: 'visitors' },
        }
        expect(mapData(rows, mapping, dataTypes, dimensions)[0]).toEqual({
            category: 'B',
            value: 35,
        })
    })

    test('counts rows when the value is not mapped', () => {
        const mapping = { category: { value: 'month' } }
        const result = mapData(rows, mapping, dataTypes, dimensions)
        expect(mapping.value).toEqual({ value: undefined })
        expect(result).toEqual([
            { category: 'B', value: 2 },
            { category: 'A', value: 2 },
            { category: 'C', value: 1 },
        ])
    })

    test('counts rows when the value is mapped to undefined', () => {
        const mapping = {
            category: { value: 'month' },
            value: { value: undefined },
        }
        expect(
            mapData(rows, mapping, dataTypes, dimensions).map((d) => d.value)
        ).toEqual([2, 2, 1])
    })

    test('rows without a category are left out', () => {
        const mapping = {
            category: { value: 'month' },
            value: { value: 'visitors', config: { aggregation: 'sum' } },
        }
        const result = mapData(
            [
                { month: 'A', visitors: 10 },
                { month: '', visitors: 99 },
                { month: null, visitors: 99 },
                { month: undefined, visitors: 99 },
                { month: 'B', visitors: 30 },
            ],
            mapping,
            { month: { type: 'string' }, visitors: { type: 'number' } },
            dimensions
        )
        expect(result).toEqual([
            { category: 'A', value: 10 },
            { category: 'B', value: 30 },
        ])
    })

    test('keeps a category 0 and returns numbers as numbers', () => {
        const mapping = { category: { value: 'month' } }
        const result = mapData(
            [{ month: 0 }, { month: 10 }, { month: 0 }, { month: 9 }],
            mapping,
            { month: { type: 'number' } },
            dimensions
        )
        expect(result).toEqual([
            { category: 0, value: 2 },
            { category: 10, value: 1 },
            { category: 9, value: 1 },
        ])
        result.forEach((d) => expect(typeof d.category).toBe('number'))
    })

    test('returns date categories as Date', () => {
        const dates = [
            { day: new Date(2020, 0, 6), n: 10 },
            { day: new Date(2020, 0, 5), n: 1 },
            { day: new Date(2020, 0, 5), n: 2 },
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
        expect(result).toHaveLength(2)
        result.forEach((d) => expect(d.category).toBeInstanceOf(Date))
        expect(result.map((d) => d.category.getTime())).toEqual([
            new Date(2020, 0, 6).getTime(),
            new Date(2020, 0, 5).getTime(),
        ])
        expect(result.map((d) => d.value)).toEqual([10, 3])
    })

    test('groups the same date into one category even for different Date objects', () => {
        const mapping = { category: { value: 'day' } }
        const result = mapData(
            [
                { day: new Date('2024-01-01T00:00:00Z') },
                { day: new Date('2024-01-02T00:00:00Z') },
                { day: new Date('2024-01-01T00:00:00Z') },
            ],
            mapping,
            { day: { type: 'date', dateFormat: 'YYYY-MM-DD' } },
            dimensions
        )
        expect(result.map((d) => d.value)).toEqual([2, 1])
    })

    test('returns an empty array for empty data', () => {
        const mapping = { category: { value: 'month' } }
        expect(mapData([], mapping, dataTypes, dimensions)).toEqual([])
    })
})

describe('prepareItems', () => {
    const items = [
        { category: 'b', value: 20 },
        { category: 'a', value: 50 },
        { category: 'c', value: 5 },
        { category: 'd', value: 20 },
    ]
    const names = (list) => list.map((d) => d.category)

    test('keeps the original order', () => {
        expect(names(prepareItems(items, 'original'))).toEqual([
            'b',
            'a',
            'c',
            'd',
        ])
    })

    test('sorts by size, ties keep the input order', () => {
        expect(names(prepareItems(items, 'totalDescending'))).toEqual([
            'a',
            'b',
            'd',
            'c',
        ])
        expect(names(prepareItems(items, 'totalAscending'))).toEqual([
            'c',
            'b',
            'd',
            'a',
        ])
    })

    test('sorts by name', () => {
        expect(names(prepareItems(items, 'name'))).toEqual(['a', 'b', 'c', 'd'])
    })

    test('sorts by name in natural order', () => {
        const sortedNames = (categories) =>
            names(
                prepareItems(
                    categories.map((category) => ({ category, value: 1 })),
                    'name'
                )
            )
        expect(sortedNames(['10月', '2月', '1月'])).toEqual([
            '1月',
            '2月',
            '10月',
        ])
        expect(sortedNames([100, 9, 10])).toEqual([9, 10, 100])
    })

    test('sorts dates by time when sorting by name', () => {
        const later = new Date(2024, 5, 1)
        const earlier = new Date(2023, 0, 1)
        const result = prepareItems(
            [
                { category: later, value: 1 },
                { category: earlier, value: 1 },
            ],
            'name'
        )
        expect(result.map((d) => d.category.getTime())).toEqual([
            earlier.getTime(),
            later.getTime(),
        ])
    })

    test('uses the label function for the category in the messages', () => {
        expect(() =>
            prepareItems([{ category: 1, value: -1 }], 'original', (c) => `L${c}`)
        ).toThrow(/L1/)
    })

    test('does not modify its input', () => {
        const copy = JSON.parse(JSON.stringify(items))
        prepareItems(items, 'name')
        expect(items).toEqual(copy)
    })

    test('an empty cell (null) counts as 0', () => {
        const result = prepareItems(
            [
                { category: 'A', value: 3 },
                { category: 'B', value: null },
            ],
            'original'
        )
        expect(result.map((d) => d.value)).toEqual([3, 0])
    })

    test('negative values are rejected', () => {
        expect(() =>
            prepareItems(
                [
                    { category: 'A', value: 10 },
                    { category: 'B', value: -3 },
                ],
                'original'
            )
        ).toThrow(/negative/)
    })

    test('values that are not numbers are rejected', () => {
        expect(() =>
            prepareItems([{ category: 'A', value: undefined }], 'original')
        ).toThrow(/only numbers/)
        expect(() =>
            prepareItems([{ category: 'A', value: '1,2' }], 'original')
        ).toThrow(/only numbers/)
        expect(() =>
            prepareItems([{ category: 'A', value: NaN }], 'original')
        ).toThrow(/only numbers/)
    })
})

describe('compareCategories', () => {
    test('compares numbers by value, dates by time and others as natural text', () => {
        expect(compareCategories(9, 10)).toBeLessThan(0)
        expect(compareCategories(100, 10)).toBeGreaterThan(0)
        expect(
            compareCategories(new Date(2024, 0, 1), new Date(2024, 0, 2))
        ).toBeLessThan(0)
        expect(compareCategories('2月', '10月')).toBeLessThan(0)
        expect(compareCategories('a', 'a')).toBe(0)
    })
})

describe('radiusScaleFor', () => {
    test('area: 0 is at the inner circle and the maximum at the outer circle', () => {
        const radius = radiusScaleFor(100, 20, 100, 'area')
        expect(radius(0)).toBeCloseTo(20)
        expect(radius(100)).toBeCloseTo(100)
    })

    test('area: the area outside the inner circle is proportional to the value', () => {
        const inner = 20
        const radius = radiusScaleFor(100, inner, 100, 'area')
        const ring = (value) => radius(value) ** 2 - inner ** 2
        expect(ring(50)).toBeCloseTo(ring(100) / 2)
        expect(ring(25)).toBeCloseTo(ring(100) / 4)
    })

    test('area: without inner circle, the radius is the square root of the share', () => {
        const radius = radiusScaleFor(100, 0, 80, 'area')
        expect(radius(25)).toBeCloseTo(40)
    })

    test('radius: the length from the inner circle is proportional to the value', () => {
        const radius = radiusScaleFor(100, 20, 100, 'radius')
        expect(radius(0)).toBeCloseTo(20)
        expect(radius(25)).toBeCloseTo(40)
        expect(radius(50)).toBeCloseTo(60)
        expect(radius(100)).toBeCloseTo(100)
    })

    test('a maximum of 0 puts every value at the inner circle', () => {
        expect(radiusScaleFor(0, 10, 50, 'area')(0)).toBeCloseTo(10)
        expect(radiusScaleFor(0, 10, 50, 'radius')(0)).toBeCloseTo(10)
        expect(radiusScaleFor(0, 0, 50, 'area')(0)).toBe(0)
    })

    test('rejects an unknown encoding', () => {
        expect(() => radiusScaleFor(10, 0, 50, 'angle')).toThrow(/encoding/)
    })
})
