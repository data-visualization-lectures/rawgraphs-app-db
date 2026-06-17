import React from 'react'
import classNames from 'classnames'
import { get } from 'lodash'
import { dateFormats } from '@rawgraphs/rawgraphs-core'
import S from './DataGrid.module.scss'

const DATE_FORMATS = Object.keys(dateFormats)

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

export default DateFormatSelector
