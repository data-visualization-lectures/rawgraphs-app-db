import React from 'react'
import classNames from 'classnames'
import DataTypeSelector from './DataTypeSelector'
import S from './DataGrid.module.scss'

export default function DataGridHeaderRenderer({
  column,
  sortDirection,
  onSort,
}) {
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
