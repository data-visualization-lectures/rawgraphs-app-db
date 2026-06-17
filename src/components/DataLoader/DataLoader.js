import { get } from 'lodash'
import React, { useCallback, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import {
  BsClipboard,
  BsCloud,
  BsFolder,
  BsGift,
  BsSearch,
  BsUpload,
} from 'react-icons/bs'
// DataSamples removed — sample data now accessed via tool header picker
import LoadProject from './loaders/LoadProject'

import Paste from './loaders/Paste'
import UploadFile from './loaders/UploadFile'
import UrlFetch from './loaders/UrlFetch'
import WarningMessage from '../WarningMessage'
import DataMismatchModal from './DataMismatchModal'
import DataLoaderActionSidebar from './DataLoaderActionSidebar'
import DataLoaderMainContent from './DataLoaderMainContent'
import DataLoaderOptionList from './DataLoaderOptionList'
import ParsingErrorMessage from './ParsingErrorMessage'
import SparqlFetch from './loaders/SparqlFetch'

function DataLoader({
  userInput,
  setUserInput,
  userData,
  userDataType,
  parseError,
  unstackedColumns,
  separator,
  setSeparator,
  thousandsSeparator,
  setThousandsSeparator,
  decimalsSeparator,
  setDecimalsSeparator,
  locale,
  setLocale,
  stackDimension,
  dataSource,
  data,
  loading,
  coerceTypes,
  handleInlineEdit,
  handleStackOperation,
  setJsonData,
  dataLoaderMode,
  startDataReplace,
  cancelDataReplace,
  commitDataReplace,
  replaceRequiresConfirmation,
  hydrateFromProject,
}) {
  const { t } = useTranslation()
  const [loadingError, setLoadingError] = useState()
  const options = [
    {
      id: 'paste',
      name: t('dataLoader.paste.name'),
      loader: (
        <Paste
          userInput={userInput}
          setUserInput={(rawInput) => setUserInput(rawInput, { type: 'paste' })}
          setLoadingError={setLoadingError}
        />
      ),
      message: t('dataLoader.paste.message'),
      icon: BsClipboard,
      allowedForReplace: true,
    },
    {
      id: 'upload',
      name: t('dataLoader.upload.name'),
      loader: (
        <UploadFile
          userInput={userInput}
          setUserInput={(rawInput) => setUserInput(rawInput, { type: 'file' })}
          setLoadingError={setLoadingError}
        />
      ),
      message: t('dataLoader.upload.message'),
      icon: BsUpload,
      allowedForReplace: true,
    },
    {
      id: 'samples',
      name: t('dataLoader.samples.name'),
      message: '',
      loader: (
        <div
          className="d-flex align-items-center justify-content-center p-4 text-muted"
          style={{ minHeight: 120 }}
        >
          <p className="text-center m-0" style={{ fontSize: '0.95rem' }}>
            {t('dataLoader.samples.toolbarHint', {
              defaultValue:
                'ツールバーの「サンプルデータ」ボタンから選択してください',
            })}
          </p>
        </div>
      ),
      icon: BsGift,
      allowedForReplace: true,
    },
    {
      id: 'sparql',
      name: t('dataLoader.sparql.name'),
      message: t('dataLoader.sparql.message'),
      loader: (
        <SparqlFetch
          userInput={userInput}
          setUserInput={(rawInput, source) => setUserInput(rawInput, source)}
          setLoadingError={setLoadingError}
        />
      ),
      icon: BsCloud,
      disabled: false,
      allowedForReplace: true,
    },
    {
      id: 'url',
      name: t('dataLoader.url.name'),
      message: t('dataLoader.url.message'),
      loader: (
        <UrlFetch
          userInput={userInput}
          setUserInput={(rawInput, source) => setUserInput(rawInput, source)}
          setLoadingError={setLoadingError}
        />
      ),
      icon: BsSearch,
      disabled: false,
      allowedForReplace: true,
    },
    {
      id: 'project',
      name: t('dataLoader.project.name'),
      message: t('dataLoader.project.message'),
      loader: (
        <LoadProject
          onProjectSelected={hydrateFromProject}
          setLoadingError={setLoadingError}
        />
      ),
      icon: BsFolder,
      allowedForReplace: false,
    },
  ]
  const [optionIndex, setOptionIndex] = useState(0)
  const selectedOption = options[optionIndex]

  const reloadRAW = useCallback(() => {
    window.location.replace(window.location.pathname)
  }, [])

  return (
    <>
      <Row>
        {!userData && (
          <DataLoaderOptionList
            cancelDataReplace={cancelDataReplace}
            dataLoaderMode={dataLoaderMode}
            options={options}
            reloadRAW={reloadRAW}
            selectedOptionId={selectedOption.id}
            setOptionIndex={setOptionIndex}
            t={t}
            userDataType={userDataType}
          />
        )}
        {userData && (
          <DataLoaderActionSidebar
            data={data}
            dataSource={dataSource}
            decimalsSeparator={decimalsSeparator}
            handleStackOperation={handleStackOperation}
            locale={locale}
            reloadRAW={reloadRAW}
            separator={separator}
            setDecimalsSeparator={setDecimalsSeparator}
            setLocale={setLocale}
            setOptionIndex={setOptionIndex}
            setSeparator={setSeparator}
            setThousandsSeparator={setThousandsSeparator}
            setUserInput={setUserInput}
            stackDimension={stackDimension}
            startDataReplace={startDataReplace}
            t={t}
            thousandsSeparator={thousandsSeparator}
            unstackedColumns={unstackedColumns}
            userDataType={userDataType}
          />
        )}
        <Col>
          <Row className="h-100">
            <Col className="h-100">
              <DataLoaderMainContent
                coerceTypes={coerceTypes}
                data={data}
                handleInlineEdit={handleInlineEdit}
                loading={loading}
                selectedOption={selectedOption}
                setJsonData={setJsonData}
                userData={userData}
                userDataType={userDataType}
                userInput={userInput}
              />

              {data && !parseError && get(data, 'errors', []).length === 0 && (
                <WarningMessage
                  variant="success"
                  message={
                    <span>
                      <span className="font-weight-bold">
                        {data.dataset.length}{' '}
                        {t('dataLoader.success.rows', { defaultValue: '行' })}
                      </span>{' '}
                      (
                      {data.dataset.length * Object.keys(data.dataTypes).length}{' '}
                      {t('dataLoader.success.cells', { defaultValue: 'セル' })}){' '}
                      {t('dataLoader.success.body', {
                        defaultValue:
                          'のデータが上手く取り込めました。それではチャートを選んでいきましょう！',
                      })}
                    </span>
                  }
                />
              )}

              {parseError && (
                <WarningMessage variant="danger" message={parseError} />
              )}

              {get(data, 'errors', []).length > 0 && (
                <WarningMessage
                  variant="warning"
                  message={<ParsingErrorMessage data={data} t={t} />}
                />
              )}

              {loadingError && (
                <WarningMessage variant="danger" message={loadingError} />
              )}
            </Col>
          </Row>
        </Col>
      </Row>
      {replaceRequiresConfirmation && (
        <DataMismatchModal
          replaceRequiresConfirmation={replaceRequiresConfirmation}
          commitDataReplace={commitDataReplace}
          cancelDataReplace={cancelDataReplace}
        />
      )}
    </>
  )
}

export default React.memo(DataLoader)
