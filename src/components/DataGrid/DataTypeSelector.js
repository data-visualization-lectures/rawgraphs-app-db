import React, { useCallback, useRef, useState } from 'react'
import { Overlay, OverlayTrigger } from 'react-bootstrap'
import classNames from 'classnames'
import { get, isEqual } from 'lodash'
import {
  dataTypeIcons,
  DateIcon,
  StringIcon,
  NumberIcon,
} from '../../constants'
import { BsFillCaretRightFill } from 'react-icons/bs'
import DateFormatSelector from './DateFormatSelector'
import S from './DataGrid.module.scss'

export default function DataTypeSelector({
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
        {(overlayProps) => {
          const props = { ...overlayProps }
          delete props.placement
          delete props.scheduleUpdate
          delete props.arrowProps
          delete props.outOfBoundaries
          delete props.show

          return (
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
          )
        }}
      </Overlay>
    </>
  )
}
