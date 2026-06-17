import { getTypeName } from '@rawgraphs/rawgraphs-core'

function compareEmptyValues(aValue, bValue) {
  const isAEmpty = aValue === null || aValue === undefined || aValue === ''
  const isBEmpty = bValue === null || bValue === undefined || bValue === ''
  if (isAEmpty && isBEmpty) return 0
  if (isAEmpty) return 1
  if (isBEmpty) return -1
  return null
}

function compareNumbers(aValue, bValue) {
  const emptyComparison = compareEmptyValues(aValue, bValue)
  if (emptyComparison !== null) return emptyComparison

  const aNumber = Number(aValue)
  const bNumber = Number(bValue)
  if (Number.isNaN(aNumber) && Number.isNaN(bNumber)) return 0
  if (Number.isNaN(aNumber)) return 1
  if (Number.isNaN(bNumber)) return -1
  return aNumber - bNumber
}

function compareDates(aValue, bValue) {
  const emptyComparison = compareEmptyValues(aValue, bValue)
  if (emptyComparison !== null) return emptyComparison

  const aTime =
    aValue instanceof Date ? aValue.valueOf() : new Date(aValue).valueOf()
  const bTime =
    bValue instanceof Date ? bValue.valueOf() : new Date(bValue).valueOf()
  if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0
  if (Number.isNaN(aTime)) return 1
  if (Number.isNaN(bTime)) return -1
  return aTime - bTime
}

function compareStrings(aValue, bValue) {
  const emptyComparison = compareEmptyValues(aValue, bValue)
  if (emptyComparison !== null) return emptyComparison
  return aValue.toString().localeCompare(bValue.toString())
}

export function sortDataGridRows({ dataTypes, rows, sortColumn }) {
  if (!sortColumn) return rows

  const sortColumnKey = sortColumn.columnKey
  const sortDirection = sortColumn.direction
  const sortColumnType =
    sortColumnKey === '_id' ? 'number' : getTypeName(dataTypes[sortColumnKey])
  const getSortableValue = (row) =>
    sortColumnKey === '_id' ? row._id : row._stage3?.[sortColumnKey]

  const sortedRows = [...rows]
  if (sortColumnType === 'number') {
    sortedRows.sort((a, b) =>
      compareNumbers(getSortableValue(a), getSortableValue(b))
    )
  } else if (sortColumnType === 'date') {
    sortedRows.sort((a, b) =>
      compareDates(getSortableValue(a), getSortableValue(b))
    )
  } else {
    sortedRows.sort((a, b) =>
      compareStrings(getSortableValue(a), getSortableValue(b))
    )
  }

  return sortDirection === 'DESC' ? sortedRows.reverse() : sortedRows
}
