import React from 'react'
import { useTranslation } from 'react-i18next'
import { Row, Col, Button } from 'react-bootstrap'
import SeparatorSelector from './SeparatorSelector'
import ThousandsSeparatorSelector from './ThousandsSeparatorSelector'
import DecimalsSeparatorSelector from './DecimalsSeparatorSelector'
import DateLocaleSelector from './DateLocaleSelector'
import StackSelector from './StackSelector'

import styles from './ParsingOptions.module.scss'
import { BsArrowRepeat } from 'react-icons/bs'
import { get } from 'lodash'
import { fetchData as fetchDataFromUrl } from '../DataLoader/loaders/UrlFetch'
import { fetchData as fetchDataFromSparql } from '../DataLoader/loaders/SparqlFetch'

const dataRefreshWorkers = {
  "url": fetchDataFromUrl,
  "sparql": fetchDataFromSparql
}

const dataRefreshCaptionKeys = {
  "url": "parsing.refreshUrl",
  "sparql": "parsing.refreshSparql"
}

export default function ParsingOptions(props) {
  const { t } = useTranslation()
  const refreshData = async () => {
    const dataRefreshImpl = dataRefreshWorkers[get(props.dataSource, "type", "")]
    const data = await dataRefreshImpl(props.dataSource)
    props.onDataRefreshed(data)
  }

  return (
    <Row>
      <Col className={styles.parsingOptions}>
        <b>{t('parsing.interpretation')}</b>

        {props.userDataType === 'csv' && (
          <SeparatorSelector
            title={t('parsing.separator')}
            value={props.separator}
            onChange={(nextSeparator) => props.setSeparator(nextSeparator)}
          />
        )}
        <ThousandsSeparatorSelector
          title={t('parsing.thousands')}
          value={props.thousandsSeparator}
          onChange={(nextSeparator) =>
            props.setThousandsSeparator(nextSeparator)
          }
        />
        <DecimalsSeparatorSelector
          title={t('parsing.decimals')}
          value={props.decimalsSeparator}
          onChange={(nextSeparator) =>
            props.setDecimalsSeparator(nextSeparator)
          }
        />

        <DateLocaleSelector
          title={t('parsing.dateLocale')}
          value={props.locale}
          onChange={(nextLocale) => props.setLocale(nextLocale)}
        />

        {get(dataRefreshWorkers, get(props.dataSource, 'type', ''), null) && (
          <Button
            color="primary"
            className={styles['refresh-button']}
            onClick={() => refreshData()}
          >
            <BsArrowRepeat className="mr-2" />
            {t(get(dataRefreshCaptionKeys, get(props.dataSource, 'type', ''), 'parsing.refreshDefault'))}
          </Button>
        )}

        <div className="divider mb-3 mt-0" />

        <b>{t('parsing.transformation')}</b>

        <StackSelector
          title={t('parsing.stack')}
          value={props.stackDimension}
          list={props.dimensions}
          onChange={(nextStackDimension) =>
            props.setStackDimension(nextStackDimension)
          }
        />
      </Col>
    </Row>
  )
}
