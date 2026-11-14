import {
    mapData,
    allocateCells,
    prepareItems,
    compareCategories,
    dimensions,
} from './mapping'

describe('Waffle chart data mapping', () => {
    const dataTypes = {
        mode: { type: 'string' },
        count: { type: 'number' },
    }

    const rows = [
        { mode: 'Bus', count: 5 },
        { mode: 'Walk', count: 30 },
        { mode: 'Bus', count: 10 },
        { mode: 'Bike', count: 20 },
        { mode: 'Walk', count: 5 },
    ]

    test('aggregates by category and keeps the order of first appearance', () => {
        const mapping = {
            category: { value: 'mode' },
            value: { value: 'count', config: { aggregation: 'sum' } },
        }
        expect(mapData(rows, mapping, dataTypes, dimensions)).toEqual([
            { category: 'Bus', value: 15 },
            { category: 'Walk', value: 35 },
            { category: 'Bike', value: 20 },
        ])
    })

    test('uses the aggregation chosen for the value', () => {
        const mapping = {
            category: { value: 'mode' },
            value: { value: 'count', config: { aggregation: 'max' } },
        }
        expect(
            mapData(rows, mapping, dataTypes, dimensions).map((d) => d.value)
        ).toEqual([10, 30, 20])
    })

    test('sums by default when the value has no explicit aggregation', () => {
        const mapping = {
            category: { value: 'mode' },
            value: { value: 'count' },
        }
        expect(
            mapData(rows, mapping, dataTypes, dimensions).map((d) => d.value)
        ).toEqual([15, 35, 20])
    })

    test('counts rows when the value is not mapped', () => {
        const mapping = { category: { value: 'mode' } }
        const result = mapData(rows, mapping, dataTypes, dimensions)
        expect(mapping.value).toEqual({ value: undefined })
        expect(result).toEqual([
            { category: 'Bus', value: 2 },
            { category: 'Walk', value: 2 },
            { category: 'Bike', value: 1 },
        ])
    })

    test('counts rows when the value is mapped to undefined', () => {
        const mapping = {
            category: { value: 'mode' },
            value: { value: undefined },
        }
        expect(
            mapData(rows, mapping, dataTypes, dimensions).map((d) => d.value)
        ).toEqual([2, 2, 1])
    })

    test('leaves out the rows without a category', () => {
        const withEmpty = [
            { mode: 'Bus', count: 10 },
            { mode: '', count: 99 },
            { mode: null, count: 99 },
            { mode: undefined, count: 99 },
            { mode: 'Walk', count: 30 },
        ]
        const mapping = {
            category: { value: 'mode' },
            value: { value: 'count', config: { aggregation: 'sum' } },
        }
        expect(mapData(withEmpty, mapping, dataTypes, dimensions)).toEqual([
            { category: 'Bus', value: 10 },
            { category: 'Walk', value: 30 },
        ])
    })

    test('keeps a category with the value 0', () => {
        const mapping = {
            category: { value: 'mode' },
            value: { value: 'count', config: { aggregation: 'sum' } },
        }
        const result = mapData(
            [
                { mode: 'A', count: 0 },
                { mode: 'B', count: 4 },
            ],
            mapping,
            dataTypes,
            dimensions
        )
        expect(result).toEqual([
            { category: 'A', value: 0 },
            { category: 'B', value: 4 },
        ])
    })

    test('returns number categories as numbers', () => {
        const mapping = {
            category: { value: 'year' },
            value: { value: 'count', config: { aggregation: 'sum' } },
        }
        const result = mapData(
            [
                { year: 2021, count: 1 },
                { year: 2020, count: 2 },
                { year: 2021, count: 3 },
                { year: 0, count: 5 },
            ],
            mapping,
            { year: { type: 'number' }, count: { type: 'number' } },
            dimensions
        )
        expect(result).toEqual([
            { category: 2021, value: 4 },
            { category: 2020, value: 2 },
            { category: 0, value: 5 },
        ])
        result.forEach((d) => expect(typeof d.category).toBe('number'))
    })

    test('returns date categories as Date and groups equal dates', () => {
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

    test('counts rows of a date category when the value is not mapped', () => {
        const mapping = { category: { value: 'day' } }
        const result = mapData(
            [
                { day: new Date(2024, 0, 1) },
                { day: new Date(2024, 0, 2) },
                { day: new Date(2024, 0, 1) },
            ],
            mapping,
            { day: { type: 'date', dateFormat: 'YYYY-MM-DD' } },
            dimensions
        )
        expect(result.map((d) => d.value)).toEqual([2, 1])
    })

    test('returns an empty array for empty data', () => {
        const mapping = { category: { value: 'mode' } }
        expect(mapData([], mapping, dataTypes, dimensions)).toEqual([])
    })

    test('declares the dimensions', () => {
        const [category, value] = dimensions
        expect(category).toMatchObject({
            id: 'category',
            name: 'Category',
            validTypes: ['number', 'date', 'string'],
            required: true,
            operation: 'get',
        })
        expect(value).toMatchObject({
            id: 'value',
            name: 'Value',
            validTypes: ['number'],
            required: false,
            operation: 'get',
            aggregation: true,
            aggregationDefault: 'sum',
        })
    })
})

describe('prepareItems', () => {
    test('treats an empty value as 0', () => {
        expect(
            prepareItems([
                { category: 'a', value: null },
                { category: 'b', value: 3 },
            ])
        ).toEqual([
            { category: 'a', value: 0 },
            { category: 'b', value: 3 },
        ])
    })

    test('throws on a value that is not a number', () => {
        expect(() => prepareItems([{ category: 'a', value: 'x' }])).toThrow(
            /needs one number/
        )
        expect(() => prepareItems([{ category: 'a', value: NaN }])).toThrow(
            /needs one number/
        )
        expect(() =>
            prepareItems([{ category: 'a', value: Infinity }])
        ).toThrow(/needs one number/)
    })

    test('throws on a negative value', () => {
        expect(() => prepareItems([{ category: 'a', value: -1 }])).toThrow(
            /negative/
        )
    })

    test('uses the label function for the category in the messages', () => {
        const label = (c) => `label-${c}`
        expect(() =>
            prepareItems([{ category: 1, value: -1 }], label)
        ).toThrow(/label-1/)
        expect(() =>
            prepareItems([{ category: 1, value: 'x' }], label)
        ).toThrow(/label-1/)
    })
})

describe('compareCategories', () => {
    const sortNames = (list) => list.slice().sort(compareCategories)

    test('sorts text with numbers in natural order', () => {
        expect(sortNames(['10月', '2月', '1月'])).toEqual(['1月', '2月', '10月'])
    })

    test('sorts numbers by value', () => {
        expect(sortNames([100, 9, 10])).toEqual([9, 10, 100])
        expect(sortNames([5, -3, 0])).toEqual([-3, 0, 5])
    })

    test('sorts dates by time', () => {
        const dates = [
            new Date(2024, 2, 1),
            new Date(2023, 11, 31),
            new Date(2024, 0, 15),
        ]
        expect(sortNames(dates).map((d) => d.getTime())).toEqual([
            dates[1].getTime(),
            dates[2].getTime(),
            dates[0].getTime(),
        ])
    })

    test('compares anything else as text', () => {
        expect(compareCategories('a', 'b')).toBeLessThan(0)
        expect(compareCategories('9', 10)).toBeLessThan(0)
    })
})

describe('allocateCells', () => {
    const cellsOf = (items, total) =>
        allocateCells(items, total).map((d) => d.cells)

    test('gives each item its exact share when it divides evenly', () => {
        expect(
            cellsOf(
                [
                    { category: 'a', value: 50 },
                    { category: 'b', value: 30 },
                    { category: 'c', value: 20 },
                ],
                100
            )
        ).toEqual([50, 30, 20])
    })

    test('gives the leftover cells to the largest fractional parts', () => {
        // quotas: 3.333, 3.333, 3.333 -> tie, input order decides
        expect(
            cellsOf(
                [
                    { category: 'a', value: 1 },
                    { category: 'b', value: 1 },
                    { category: 'c', value: 1 },
                ],
                10
            )
        ).toEqual([4, 3, 3])

        // quotas: 1.2, 1.5, 2.3 -> floors 1, 1, 2 and the leftover goes to b
        expect(
            cellsOf(
                [
                    { category: 'a', value: 24 },
                    { category: 'b', value: 30 },
                    { category: 'c', value: 46 },
                ],
                5
            )
        ).toEqual([1, 2, 2])
    })

    test('breaks ties by the input order', () => {
        // quotas 0.5 each, 1 cell: the first item wins
        expect(
            cellsOf(
                [
                    { category: 'a', value: 1 },
                    { category: 'b', value: 1 },
                ],
                1
            )
        ).toEqual([1, 0])
    })

    test('always sums to the total number of cells', () => {
        const values = [7, 13, 29, 3, 41, 11, 1]
        const items = values.map((value, i) => ({ category: `c${i}`, value }))
        for (const total of [1, 2, 7, 10, 33, 100, 101, 250]) {
            const cells = cellsOf(items, total)
            expect(cells.reduce((a, b) => a + b, 0)).toBe(total)
            cells.forEach((c) => expect(Number.isInteger(c)).toBe(true))
        }
    })

    test('works with decimal values', () => {
        const cells = cellsOf(
            [
                { category: 'a', value: 0.1 },
                { category: 'b', value: 0.2 },
                { category: 'c', value: 0.7 },
            ],
            10
        )
        expect(cells).toEqual([1, 2, 7])
    })

    test('gives no cell to an item with the value 0', () => {
        expect(
            cellsOf(
                [
                    { category: 'a', value: 0 },
                    { category: 'b', value: 1 },
                    { category: 'c', value: 2 },
                ],
                10
            )
        ).toEqual([0, 3, 7])
    })

    test('treats an empty value as 0', () => {
        expect(
            cellsOf(
                [
                    { category: 'a', value: null },
                    { category: 'b', value: 5 },
                ],
                4
            )
        ).toEqual([0, 4])
    })

    test('keeps the other properties and does not modify its input', () => {
        const items = [
            { category: 'a', value: 1, extra: 'x' },
            { category: 'b', value: 3 },
        ]
        const copy = JSON.parse(JSON.stringify(items))
        const result = allocateCells(items, 4)
        expect(result).toEqual([
            { category: 'a', value: 1, extra: 'x', cells: 1 },
            { category: 'b', value: 3, cells: 3 },
        ])
        expect(items).toEqual(copy)
    })

    test('throws when the total is 0 or less', () => {
        expect(() =>
            allocateCells([{ category: 'a', value: 0 }], 10)
        ).toThrow(/greater than 0/)
        expect(() => allocateCells([], 10)).toThrow(/greater than 0/)
    })

    test('throws on invalid values', () => {
        expect(() =>
            allocateCells([{ category: 'a', value: 'x' }], 10)
        ).toThrow(/needs one number/)
        expect(() =>
            allocateCells([{ category: 'a', value: -2 }], 10)
        ).toThrow(/negative/)
    })

    test('throws when the number of cells is not a positive integer', () => {
        const items = [{ category: 'a', value: 1 }]
        expect(() => allocateCells(items, 0)).toThrow(Error)
        expect(() => allocateCells(items, 2.5)).toThrow(Error)
    })
})
