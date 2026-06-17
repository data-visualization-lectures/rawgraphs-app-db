import React from 'react'
import DataGrid from '../DataGrid/DataGrid'
import JsonViewer from '../JsonViewer'
import Loading from './loading'

export default function DataLoaderMainContent({
  coerceTypes,
  data,
  handleInlineEdit,
  loading,
  selectedOption,
  setJsonData,
  userData,
  userDataType,
  userInput,
}) {
  if (userData && data) {
    return (
      <DataGrid
        userDataset={userData}
        dataset={data.dataset}
        errors={data.errors}
        dataTypes={data.dataTypes}
        coerceTypes={coerceTypes}
        onDataUpdate={handleInlineEdit}
      />
    )
  }

  if (userDataType === 'json' && userData === null) {
    return (
      <JsonViewer
        context={JSON.parse(userInput)}
        selectFilter={(ctx) => Array.isArray(ctx)}
        onSelect={(ctx, path) => {
          setJsonData(ctx, path)
        }}
      />
    )
  }

  if (loading && !data) {
    return <Loading />
  }

  return (
    <>
      {selectedOption.loader}
      <p className="mt-3">{selectedOption.message}</p>
    </>
  )
}
