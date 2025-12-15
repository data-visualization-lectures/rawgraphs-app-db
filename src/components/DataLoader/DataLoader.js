import { get } from 'lodash'
import React, { useCallback, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import {
  BsArrowCounterclockwise,
  BsArrowRepeat,
  BsClipboard,
  BsCloud,
  BsFolder,
  BsGift,
  BsSearch,
  BsUpload,
} from 'react-icons/bs'
import { DATA_LOADER_MODE } from '../../hooks/useDataLoader'
import DataGrid from '../DataGrid/DataGrid'
import DataSamples from '../DataSamples/DataSamples'
import JsonViewer from '../JsonViewer'
import ParsingOptions from '../ParsingOptions'
import styles from './DataLoader.module.scss'
import LoadProject from './loaders/LoadProject'
import LoadCloudProject from './loaders/LoadCloudProject'
import Paste from './loaders/Paste'
import UploadFile from './loaders/UploadFile'
import UrlFetch from './loaders/UrlFetch'
import Loading from './loading'
import WarningMessage from '../WarningMessage'
import DataMismatchModal from './DataMismatchModal'
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
  loadSample,
  handleInlineEdit,
  handleStackOperation,
  setJsonData,
  resetDataLoader,
  dataLoaderMode,
  startDataReplace,
  cancelDataReplace,
  commitDataReplace,
  replaceRequiresConfirmation,
  hydrateFromProject,
}) {
  const [loadingError, setLoadingError] = useState()
  const options = [
    {
      id: 'paste',
      name: 'データを貼り付ける',
      loader: (
        <Paste
          userInput={userInput}
          setUserInput={(rawInput) => setUserInput(rawInput, { type: 'paste' })}
          setLoadingError={setLoadingError}
        />
      ),
      message:
        'データを貼り付けます。表データ(TSV, CSV, DSV)形式かJSON形式が利用可能です。',
      icon: BsClipboard,
      allowedForReplace: true,
    },
    {
      id: 'upload',
      name: 'データをアップロードする',
      loader: (
        <UploadFile
          userInput={userInput}
          setUserInput={(rawInput) => setUserInput(rawInput, { type: 'file' })}
          setLoadingError={setLoadingError}
        />
      ),
      message: '表データ(TSV, CSV, DSV)形式かJSON形式をアップロードします。',
      icon: BsUpload,
      allowedForReplace: true,
    },
    {
      id: 'samples',
      name: 'サンプルデータを使う',
      message: '',
      loader: (
        <DataSamples
          onSampleReady={loadSample}
          setLoadingError={setLoadingError}
        />
      ),
      icon: BsGift,
      allowedForReplace: true,
    },
    {
      id: 'sparql',
      name: 'SPARQLクエリ',
      message: 'SparQLクエリとしてデータを読み込みます。',
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
      name: 'URLから',
      message:
        'データを示すURLから読み込む(例：Dropboxのリンクや、公開されているAPIなど)。CORSが有効になっていれば利用可能です。',
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
      name: 'ローカルから開く',
      message: 'ローカルに保存されたプロジェクト・ファイル（.rawgraphs）をアップロードします。',
      loader: (
        <LoadProject
          onProjectSelected={hydrateFromProject}
          setLoadingError={setLoadingError}
        />
      ),
      icon: BsFolder,
      allowedForReplace: false,
    },
    {
      id: 'cloud',
      name: 'サーバから開く',
      message: 'サーバに保存されたプロジェクト・ファイルを開きます。',
      loader: (
        <LoadCloudProject
          onProjectSelected={hydrateFromProject}
          setLoadingError={setLoadingError}
        />
      ),
      icon: BsCloud,
      allowedForReplace: false,
    },
  ]
  const [optionIndex, setOptionIndex] = useState(0)
  const selectedOption = options[optionIndex]

  let mainContent
  if (userData && data) {
    mainContent = (
      <DataGrid
        userDataset={userData}
        dataset={data.dataset}
        errors={data.errors}
        dataTypes={data.dataTypes}
        coerceTypes={coerceTypes}
        onDataUpdate={handleInlineEdit}
      />
    )
  } else if (userDataType === 'json' && userData === null) {
    mainContent = (
      <JsonViewer
        context={JSON.parse(userInput)}
        selectFilter={(ctx) => Array.isArray(ctx)}
        onSelect={(ctx, path) => {
          setJsonData(ctx, path)
        }}
      />
    )
  } else if (loading && !data) {
    mainContent = <Loading />
  } else {
    mainContent = (
      <>
        {selectedOption.loader}
        <p className="mt-3">
          {selectedOption.message}
          {/*<a
            href="https://rawgraphs.io/learning"
            target="_blank"
            rel="noopener noreferrer"
          >
            Check out our guides
          </a>*/}
        </p>
      </>
    )
  }

  // #TODO: memoize/move to component?
  function parsingErrors(data) {
    const errors = get(data, 'errors', [])
    const successRows = data.dataset.length - errors.length
    const row = errors[0].row + 1
    const column = Object.keys(errors[0].error)[0]
    return (
      <span>
        <span className="font-weight-bold">{row} 行目</span>の<span className="font-weight-bold">{column} 列</span>を確認してください。{' '}
        {errors.length === 2 && (
          <>
            {' '}
            {' '}
            <span className="font-weight-bold">{errors[1].row + 1}</span>行目にも別の問題があります。{' '}
          </>
        )}
        {errors.length > 2 && (
          <>
            {' '}
            {' '}
            他 <span className="font-weight-bold">{errors.length - 1}</span> 行に問題があります。
            {' '}
          </>
        )}
        {successRows > 0 && (
          <>
            残りの{' '}
            <span className="font-weight-bold">
              {successRows} 行
            </span>{' '}
            は正常に読み込めました。
          </>
        )}
      </span>
    )
  }

  const reloadRAW = useCallback(() => {
    window.location.replace(window.location.pathname)
  }, [])

  return (
    <>
      <Row>
        {!userData && (
          <Col
            xs={3}
            lg={2}
            className="d-flex flex-column justify-content-start pl-3 pr-0 options"
          >
            {options
              .filter((opt) => {
                return (
                  dataLoaderMode !== DATA_LOADER_MODE.REPLACE ||
                  opt.allowedForReplace
                )
              })
              .map((d, i) => {
                const classnames = [
                  'w-100',
                  'd-flex',
                  'align-items-center',
                  'user-select-none',
                  'cursor-pointer',
                  styles['loading-option'],
                  d.disabled ? styles['disabled'] : null,
                  d.id === selectedOption.id && !userDataType
                    ? styles.active
                    : null,
                  userDataType ? styles.disabled : null,
                ]
                  .filter((c) => c !== null)
                  .join(' ')
                return (
                  <div
                    key={d.id}
                    className={classnames}
                    onClick={() => setOptionIndex(i)}
                  >
                    <d.icon className="w-25" />
                    <h4 className="m-0 d-inline-block">{d.name}</h4>
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
                  <h4 className="m-0 d-inline-block">{'Reset'}</h4>
                </div>

                <div
                  className={`w-100 d-flex justify-content-center align-items-center ${styles['start-over']} ${styles['cancel']} user-select-none cursor-pointer mb-3`}
                  onClick={() => {
                    cancelDataReplace()
                  }}
                >
                  <h4 className="m-0 d-inline-block">{'Cancel'}</h4>
                </div>
              </>
            )}
          </Col>
        )}
        {userData && (
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
              <h4 className="m-0 d-inline-block">{'リセット'}</h4>
            </div>

            <div
              className={`w-100 d-flex justify-content-center align-items-center ${styles['start-over']} user-select-none cursor-pointer`}
              onClick={() => {
                setOptionIndex(0)
                startDataReplace()
              }}
            >
              <BsArrowCounterclockwise className="mr-2" />
              <h4 className="m-0 d-inline-block">{'データを変更する'}</h4>
            </div>
          </Col>
        )}
        <Col>
          <Row className="h-100">
            <Col className="h-100">
              {mainContent}

              {data && !parseError && get(data, 'errors', []).length === 0 && (
                <WarningMessage
                  variant="success"
                  message={
                    <span>
                      <span className="font-weight-bold">
                        {data.dataset.length} 行
                      </span>{' '}
                      (
                      {data.dataset.length * Object.keys(data.dataTypes).length}{' '}
                      セル) のデータが上手く取り込めました。それではチャートを選んでいきましょう！
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
                  message={parsingErrors(data)}
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
