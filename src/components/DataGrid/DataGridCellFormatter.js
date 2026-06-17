import React from 'react'
import classNames from 'classnames'
import S from './DataGrid.module.scss'

export default function DataGridCellFormatter({ column, row }) {
  return (
    <div
      className={classNames({ [S['has-error']]: row?._errors?.[column.key] })}
    >
      {row[column.key]?.toString()}
    </div>
  )
}
