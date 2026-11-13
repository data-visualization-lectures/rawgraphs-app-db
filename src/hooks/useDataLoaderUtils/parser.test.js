import { parseAndCheckData } from './parser'

const parse = (text, separator = null) => {
  const [dataType, data, error, extra] = parseAndCheckData(text, { separator })
  return { dataType, rows: data && data.map((row) => ({ ...row })), error, extra }
}

describe('delimited text parsing', () => {
  test('a row whose first cell is empty keeps its columns in place', () => {
    const { dataType, rows, extra } = parse('count\tcause\n128\tA\n\tB\n33\tC')
    expect(dataType).toBe('csv')
    expect(extra.separator).toBe('\t')
    expect(rows).toEqual([
      { count: '128', cause: 'A' },
      { count: '', cause: 'B' },
      { count: '33', cause: 'C' },
    ])
  })

  test('empty cells in the middle and at the end of a row are kept', () => {
    const { rows } = parse('a\tb\tc\n1\t\t3\n4\t5\t\n\t\t9')
    expect(rows).toEqual([
      { a: '1', b: '', c: '3' },
      { a: '4', b: '5', c: '' },
      { a: '', b: '', c: '9' },
    ])
  })

  test('white lines and Windows line endings are removed', () => {
    const { rows } = parse('\n\na\tb\r\n\r\n1\t2\r\n   \n3\t4\n\n')
    expect(rows).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ])
  })

  test('spaces around a line are removed', () => {
    const { rows } = parse('  a,b  \n  1,2  \n')
    expect(rows).toEqual([{ a: '1', b: '2' }])
  })

  test('a tab shared by every line is treated as indentation', () => {
    const { rows } = parse('\ta\tb\n\t1\t2\n\t3\t4')
    expect(rows).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ])
  })

  test('an empty first header cell gets a column name', () => {
    const { rows } = parse('\t2020\t2021\nTokyo\t1\t2\nOsaka\t3\t4')
    expect(rows).toEqual([
      { 'Column 1': 'Tokyo', 2020: '1', 2021: '2' },
      { 'Column 1': 'Osaka', 2020: '3', 2021: '4' },
    ])
  })

  test('comma separated data is read as before', () => {
    const { rows, extra } = parse('name,value\nA,1\n,2\nC,')
    expect(extra.separator).toBe(',')
    expect(rows).toEqual([
      { name: 'A', value: '1' },
      { name: '', value: '2' },
      { name: 'C', value: '' },
    ])
  })

  test('the separator chosen by the user is used', () => {
    const { rows, extra } = parse('a;b\n;2', ';')
    expect(extra.separator).toBe(';')
    expect(rows).toEqual([{ a: '', b: '2' }])
  })

  test('JSON is read as before', () => {
    const { dataType, rows } = parse('  [{"a": 1, "b": "x"}]\n')
    expect(dataType).toBe('json')
    expect(rows).toEqual([{ a: 1, b: 'x' }])
  })
})
