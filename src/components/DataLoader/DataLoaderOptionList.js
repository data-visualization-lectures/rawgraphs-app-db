import React from 'react'
import { Col } from 'react-bootstrap'
import { BsArrowRepeat } from 'react-icons/bs'
import { DATA_LOADER_MODE } from '../../hooks/useDataLoader'
import styles from './DataLoader.module.scss'

export default function DataLoaderOptionList({
  cancelDataReplace,
  dataLoaderMode,
  options,
  reloadRAW,
  selectedOptionId,
  setOptionIndex,
  t,
  userDataType,
}) {
  return (
    <Col
      xs={3}
      lg={2}
      className="d-flex flex-column justify-content-start pl-3 pr-0 options"
    >
      {options
        .map((option, index) => ({ option, index }))
        .filter(({ option }) => {
          return (
            dataLoaderMode !== DATA_LOADER_MODE.REPLACE ||
            option.allowedForReplace
          )
        })
        .map(({ option, index }) => {
          const Icon = option.icon
          const classnames = [
            'w-100',
            'd-flex',
            'align-items-center',
            'user-select-none',
            'cursor-pointer',
            styles['loading-option'],
            option.disabled ? styles['disabled'] : null,
            option.id === selectedOptionId && !userDataType
              ? styles.active
              : null,
            userDataType ? styles.disabled : null,
          ]
            .filter((c) => c !== null)
            .join(' ')
          return (
            <div
              key={option.id}
              className={classnames}
              onClick={() => setOptionIndex(index)}
            >
              <Icon className="w-25" />
              <h4 className="m-0 d-inline-block">{option.name}</h4>
            </div>
          )
        })}

      {dataLoaderMode === DATA_LOADER_MODE.REPLACE && (
        <>
          <div className="divider mb-3 mt-0" />
          <div
            className={`w-100 mb-2 d-flex justify-content-center align-items-center ${styles['start-over']} user-select-none cursor-pointer`}
            onClick={reloadRAW}
          >
            <BsArrowRepeat className="mr-2" />
            <h4 className="m-0 d-inline-block">{t('dataLoader.resetEn')}</h4>
          </div>

          <div
            className={`w-100 d-flex justify-content-center align-items-center ${styles['start-over']} ${styles['cancel']} user-select-none cursor-pointer mb-3`}
            onClick={cancelDataReplace}
          >
            <h4 className="m-0 d-inline-block">{t('dataLoader.cancel')}</h4>
          </div>
        </>
      )}
    </Col>
  )
}
