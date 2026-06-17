import React, { useMemo, useRef, useState, useCallback } from 'react'
import ReactDataGrid from 'react-data-grid'
import { keyBy } from 'lodash'
import DataGridCellFormatter from './DataGridCellFormatter'
import DataGridHeaderRenderer from './DataGridHeaderRenderer'
import { sortDataGridRows } from './DataGridSorting'

export default function DataGrid({
  userDataset,
  dataset,
  errors,
  dataTypes,
  coerceTypes,
  onDataUpdate,
}) {
  const [sortColumns, setSortColumns] = useState([])
  const activeSort = sortColumns[0]

  const keyedErrors = useMemo(() => keyBy(errors, 'row'), [errors])

  const containerEl = useRef()

  // Make id column just as large as needed
  // Adjust constants to fit cell padding and font size
  // (Math.floor(Math.log10(data.dataset.length)) + 1) is the number
  //   of digits of the highest id
  const rowCount = Math.max(userDataset.length, 1)
  const idColumnWidth = 24 + 8 * (Math.floor(Math.log10(rowCount)) + 1)

  const equalDinstribution =
    (containerEl.current?.getBoundingClientRect().width - idColumnWidth - 1) /
    Object.keys(dataTypes).length
  const columnWidth = equalDinstribution
    ? Math.max(equalDinstribution, 170)
    : 170

  const columns = useMemo(() => {
    if (!userDataset || !dataTypes) {
      return []
    }
    return [
      {
        key: '_id',
        name: '',
        headerRenderer: () => null,
        frozen: true,
        width: idColumnWidth,
        sortable: true,
      },
      ...Object.keys(dataTypes).map((k) => ({
        key: k,
        name: k,
        headerRenderer: DataGridHeaderRenderer,
        editable: true,
        formatter: DataGridCellFormatter,
        _raw_datatype: dataTypes[k],
        _raw_coerceType: (nextType) =>
          coerceTypes({ ...dataTypes, [k]: nextType }),
        sortable: true,
        resizable: true,
        width: columnWidth,
      })),
    ]
  }, [coerceTypes, dataTypes, userDataset, idColumnWidth, columnWidth])

  const sortedDataset = useMemo(() => {
    const datasetWithIds = userDataset.map((item, i) => ({
      // Using .map ensures that we are not mutating a property
      ...item,
      _id: i + 1, // Give items some id to populate left-most column
      _stage3: dataset[i], // The dataset parsed by raw lib basing on data types is needed for sorting!
      _errors: keyedErrors[i]?.error, // Inject errors to format cells with parsing errors
    }))
    if (!activeSort) return datasetWithIds

    return sortDataGridRows({
      dataTypes,
      rows: datasetWithIds,
      sortColumn: activeSort,
    })
  }, [userDataset, activeSort, dataTypes, dataset, keyedErrors])

  const handleRowsChange = useCallback(
    (rows, { indexes, column }) => {
      const columnKey = column?.key
      if (!Object.prototype.hasOwnProperty.call(dataTypes, columnKey)) return

      const newDataset = [...userDataset]
      indexes.forEach((rowIndex) => {
        const updatedRow = rows[rowIndex]
        const sourceIndex = updatedRow._id - 1
        if (sourceIndex < 0 || sourceIndex >= newDataset.length) return
        newDataset[sourceIndex] = {
          ...newDataset[sourceIndex],
          [columnKey]: updatedRow[columnKey],
        }
      })
      onDataUpdate && onDataUpdate(newDataset)
    },
    [dataTypes, onDataUpdate, userDataset]
  )

  const handleColumnResize = useCallback(() => {
    // react-data-grid requires a resize handler when resizable columns are enabled.
  }, [])

  const rowKeyGetter = useCallback((row) => row._id, [])

  return (
    <div ref={containerEl}>
      <ReactDataGrid
        columns={columns}
        rows={sortedDataset}
        rowKeyGetter={rowKeyGetter}
        rowHeight={48}
        sortColumns={sortColumns}
        onSortColumnsChange={setSortColumns}
        style={{ height: 432 }}
        onColumnResize={handleColumnResize}
        onRowsChange={handleRowsChange}
      />
    </div>
  )
}
