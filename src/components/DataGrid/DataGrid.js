import React, { useMemo, useRef, useState, useCallback } from 'react'
import ReactDataGrid from 'react-data-grid'
import { Overlay, OverlayTrigger } from 'react-bootstrap'
import classNames from 'classnames'
import { getTypeName, dateFormats } from '@rawgraphs/rawgraphs-core'
import S from './DataGrid.module.scss'
import { keyBy, get, isEqual } from 'lodash'
import {
  dataTypeIcons,
  DateIcon,
  StringIcon,
  NumberIcon,
} from '../../constants'
import { BsFillCaretRightFill } from 'react-icons/bs'

const DATE_FORMATS = Object.keys(dateFormats)

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

const DateFormatSelector = React.forwardRef(
  ({ currentFormat, onChange, className, ...props }, ref) => {
    return (
      <div
        className={classNames(className, S['date-format-selector'])}
        ref={ref}
        {...props}
      >
        {DATE_FORMATS.map((dateFmt) => (
          <div
            key={dateFmt}
            className={classNames(S['date-format-selector-entry'], {
              [S.selected]: get(currentFormat, 'dateFormat', '') === dateFmt,
            })}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onChange &&
                onChange({
                  type: 'date',
                  dateFormat: dateFmt,
                })
            }}
          >
            {dateFmt}
          </div>
        ))}
      </div>
    )
  }
)

function DataTypeSelector({
  currentType: typeDescriptor,
  onTypeChange,
  currentTypeComplete,
}) {
  const dataTypeIconDomRef = useRef(null)
  const [showPicker, setShowPicker] = useState(false)
  const currentType = get(typeDescriptor, 'type', typeDescriptor)

  const handleTypeChange = useCallback(
    (e) => {
      e.stopPropagation()
      e.preventDefault()
      const newType = e.target.dataset.datatype
      if (
        typeof onTypeChange === 'function' &&
        !isEqual(newType, typeDescriptor)
      ) {
        onTypeChange(newType)
      }
      setShowPicker(false)
    },
    [typeDescriptor, onTypeChange]
  )

  const handleTypeChangeDate = useCallback(
    (newType) => {
      if (
        typeof onTypeChange === 'function' &&
        !isEqual(newType, typeDescriptor)
      ) {
        onTypeChange(newType)
      }
      setShowPicker(false)
    },
    [typeDescriptor, onTypeChange]
  )

  const handleTargetClick = useCallback(
    (e) => {
      e.stopPropagation()
      e.preventDefault()
      setShowPicker(!showPicker)
    },
    [showPicker]
  )

  const Icon = dataTypeIcons[currentType]

  return (
    <>
      <span
        role="button"
        className={S['data-type-selector-trigger']}
        ref={dataTypeIconDomRef}
        onClick={handleTargetClick}
      >
        <Icon />
      </span>
      <Overlay
        target={dataTypeIconDomRef.current}
        show={showPicker}
        placement="bottom-start"
        rootClose={true}
        rootCloseEvent="click"
        onHide={() => {
          setShowPicker(false)
        }}
        container={document.body}
      >
        {({
          placement,
          scheduleUpdate,
          arrowProps,
          outOfBoundaries,
          show: _show,
          ...props
        }) => (
          <div
            id="data-type-selector"
            className={S['data-type-selector']}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            <div
              data-datatype="number"
              onClick={handleTypeChange}
              className={classNames(S['data-type-selector-item'], {
                [S.selected]: currentType === 'number',
              })}
            >
              <NumberIcon /> Number
            </div>
            <OverlayTrigger
              placement="right-start"
              overlay={
                <DateFormatSelector
                  currentType={typeDescriptor}
                  onChange={handleTypeChangeDate}
                />
              }
              trigger="click"
            >
              {({ ref, ...triggerHandler }) => (
                <div
                  ref={ref}
                  data-datatype="date"
                  {...triggerHandler}
                  className={classNames(
                    S['data-type-selector-item'],
                    S['parent-type-selector'],
                    { [S.selected]: currentType === 'date' }
                  )}
                >
                  <div>
                    <DateIcon />
                    {'Date'}
                    {currentType === 'date' && (
                      <span className={S['date-format-preview']}>
                        {' (' + currentTypeComplete.dateFormat + ')  '}
                      </span>
                    )}
                  </div>
                  <BsFillCaretRightFill
                    style={{ marginRight: 0, fill: 'var(--gray-700)' }}
                  />
                </div>
              )}
            </OverlayTrigger>
            <div
              data-datatype="string"
              onClick={handleTypeChange}
              className={classNames(S['data-type-selector-item'], {
                [S.selected]: currentType === 'string',
              })}
            >
              <StringIcon /> String
            </div>
          </div>
        )}
      </Overlay>
    </>
  )
}

function HeaderRenderer({ column, sortDirection, onSort }) {
  return (
    <div
      onClick={(event) => {
        if (column.sortable) {
          onSort(event.ctrlKey || event.metaKey)
        }
      }}
      className={classNames(
        { [S['raw-col-header']]: true },
        { [S['unsorted']]: !sortDirection },
        { [S['acs']]: sortDirection === 'ASC' },
        { [S['desc']]: sortDirection === 'DESC' }
      )}
    >
      <DataTypeSelector
        currentType={column._raw_datatype}
        onTypeChange={column._raw_coerceType}
        currentTypeComplete={column._raw_datatype}
      />
      <span
        className={classNames(S['column-name'], 'text-truncate', 'd-block')}
        title={column.name}
      >
        {column.name}
      </span>
    </div>
  )
}

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
      ...Object.keys(dataTypes).map((k, i) => ({
        key: k,
        name: k,
        headerRenderer: HeaderRenderer,
        editable: true,
        formatter: ({ row }) => {
          return (
            <div
              className={classNames({ [S['has-error']]: row?._errors?.[k] })}
            >
              {row[k]?.toString()}
              {/* {row[k]} */}
            </div>
          )
        },
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
    let datasetWithIds = userDataset.map((item, i) => ({
      // Using .map ensures that we are not mutating a property
      ...item,
      _id: i + 1, // Give items some id to populate left-most column
      _stage3: dataset[i], // The dataset parsed by raw lib basing on data types is needed for sorting!
      _errors: keyedErrors[i]?.error, // Inject errors to format cells with parsing errors
    }))
    if (!activeSort) return datasetWithIds

    const sortColumn = activeSort.columnKey
    const sortDirection = activeSort.direction
    const sortColumnType =
      sortColumn === '_id' ? 'number' : getTypeName(dataTypes[sortColumn])
    const getSortableValue = (row) =>
      sortColumn === '_id' ? row._id : row._stage3?.[sortColumn]

    if (sortColumnType === 'number') {
      datasetWithIds = datasetWithIds.sort((a, b) =>
        compareNumbers(getSortableValue(a), getSortableValue(b))
      )
    } else if (sortColumnType === 'date') {
      datasetWithIds = datasetWithIds.sort((a, b) =>
        compareDates(getSortableValue(a), getSortableValue(b))
      )
    } else {
      datasetWithIds = datasetWithIds.sort((a, b) =>
        compareStrings(getSortableValue(a), getSortableValue(b))
      )
    }

    return sortDirection === 'DESC' ? datasetWithIds.reverse() : datasetWithIds
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
