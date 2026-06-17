import React from 'react'
import { Col } from 'react-bootstrap'
import { BsArrowCounterclockwise, BsArrowRepeat } from 'react-icons/bs'
import ParsingOptions from '../ParsingOptions'
import styles from './DataLoader.module.scss'

export default function DataLoaderActionSidebar({
  data,
  dataSource,
  decimalsSeparator,
  handleStackOperation,
  locale,
  reloadRAW,
  separator,
  setDecimalsSeparator,
  setLocale,
  setOptionIndex,
  setSeparator,
  setThousandsSeparator,
  setUserInput,
  stackDimension,
  startDataReplace,
  t,
  thousandsSeparator,
  unstackedColumns,
  userDataType,
}) {
  return (
    <Col
      xs={3}
      lg={2}
      className="d-flex flex-column justify-content-start pl-3 pr-0 options"
    >
      <ParsingOptions
        locale={locale}
        setLocale={setLocale}
        separator={separator}
        setSeparator={setSeparator}
        thousandsSeparator={thousandsSeparator}
        setThousandsSeparator={setThousandsSeparator}
        decimalsSeparator={decimalsSeparator}
        setDecimalsSeparator={setDecimalsSeparator}
        dimensions={data ? unstackedColumns || data.dataTypes : []}
        stackDimension={stackDimension}
        setStackDimension={handleStackOperation}
        userDataType={userDataType}
        dataSource={dataSource}
        onDataRefreshed={(rawInput) => setUserInput(rawInput, dataSource)}
      />

      <div className="divider mb-3 mt-0" />

      <div
        className={`w-100 mb-2 d-flex justify-content-center align-items-center ${styles['start-over']} user-select-none cursor-pointer`}
        onClick={reloadRAW}
      >
        <BsArrowRepeat className="mr-2" />
        <h4 className="m-0 d-inline-block">{t('dataLoader.reset')}</h4>
      </div>

      <div
        className={`w-100 d-flex justify-content-center align-items-center ${styles['start-over']} user-select-none cursor-pointer`}
        onClick={() => {
          setOptionIndex(0)
          startDataReplace()
        }}
      >
        <BsArrowCounterclockwise className="mr-2" />
        <h4 className="m-0 d-inline-block">{t('dataLoader.replaceData')}</h4>
      </div>
    </Col>
  )
}
