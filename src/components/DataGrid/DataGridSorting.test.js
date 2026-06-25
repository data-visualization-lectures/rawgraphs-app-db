import { sortDataGridRows } from './DataGridSorting'

describe('sortDataGridRows', () => {
  it('returns the original rows when no sort column is selected', () => {
    const rows = [{ _id: 1, _stage3: { value: 10 } }]

    expect(
      sortDataGridRows({
        dataTypes: { value: 'number' },
        rows,
        sortColumn: null,
      })
    ).toBe(rows)
  })

  it('sorts numbers ascending with empty and invalid values after valid numbers', () => {
    const rows = [
      { _id: 1, _stage3: { value: 10 } },
      { _id: 2, _stage3: { value: null } },
      { _id: 3, _stage3: { value: 2 } },
      { _id: 4, _stage3: { value: 'not-a-number' } },
    ]

    const sortedRows = sortDataGridRows({
      dataTypes: { value: 'number' },
      rows,
      sortColumn: { columnKey: 'value', direction: 'ASC' },
    })

    expect(sortedRows.map((row) => row._id)).toEqual([3, 1, 4, 2])
    expect(sortedRows).not.toBe(rows)
  })

  it('sorts dates ascending using parsed stage3 values', () => {
    const rows = [
      { _id: 1, _stage3: { opened: '2024-01-10' } },
      { _id: 2, _stage3: { opened: '2023-12-20' } },
      { _id: 3, _stage3: { opened: '' } },
    ]

    const sortedRows = sortDataGridRows({
      dataTypes: { opened: 'date' },
      rows,
      sortColumn: { columnKey: 'opened', direction: 'ASC' },
    })

    expect(sortedRows.map((row) => row._id)).toEqual([2, 1, 3])
  })

  it('sorts the generated id column as numbers', () => {
    const rows = [
      { _id: 10, _stage3: { value: 'B' } },
      { _id: 2, _stage3: { value: 'A' } },
      { _id: 1, _stage3: { value: 'C' } },
    ]

    const sortedRows = sortDataGridRows({
      dataTypes: { value: 'string' },
      rows,
      sortColumn: { columnKey: '_id', direction: 'DESC' },
    })

    expect(sortedRows.map((row) => row._id)).toEqual([10, 2, 1])
  })
})
