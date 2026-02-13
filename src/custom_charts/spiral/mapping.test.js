import { mapData } from './mapping';
import * as d3 from 'd3';

// Mock d3 if necessary, but we can usage real d3 in tests usually.
// For the test to work in Jest with react-scripts, we assume d3 is available.

describe('Spiral Chart data mapping', () => {
    const data = [
        { date: '2020-01-01', value: 10, city: 'Tokyo' },
        { date: '2020-02-01', value: 15, city: 'Tokyo' },
        { date: '2020-01-01', value: 20, city: 'New York' },
        { date: '2020-02-01', value: 25, city: 'New York' },
    ];

    const dimensions = [
        { id: 'date' },
        { id: 'value' },
        { id: 'series' },
    ];

    test('should handle Series mapping correctly', () => {
        const mapping = {
            date: { value: 'date' },
            value: { value: 'value' },
            series: { value: 'city' }, // Mapped to 'city'
        };

        const result = mapData(data, mapping, {}, dimensions);

        // We expect 4 items (flat list), but with 'series' property set correctly
        expect(result).toHaveLength(4);

        const tokyoItems = result.filter(d => d.series === 'Tokyo');
        const nyItems = result.filter(d => d.series === 'New York');

        expect(tokyoItems).toHaveLength(2);
        expect(nyItems).toHaveLength(2);

        expect(tokyoItems[0].values.value).toBe(10);
        expect(nyItems[0].values.value).toBe(20);
    });

    test('should handle Unmapped Series correctly', () => {
        const mapping = {
            date: { value: 'date' },
            value: { value: 'value' },
            series: { value: undefined }, // Not mapped
        };

        const result = mapData(data, mapping, {}, dimensions);

        expect(result).toHaveLength(2);
        // Series should be undefined
        expect(result[0].series).toBeUndefined();
        // Dates should be distinct (one for each date in input)
        expect(result[0].date).toBe('2020-01-01');
        expect(result[1].date).toBe('2020-02-01');
    });
});
