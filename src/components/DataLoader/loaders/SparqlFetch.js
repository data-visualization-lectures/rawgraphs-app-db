import React, { useCallback, useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import S from './SparqlFetch.module.scss'
import { html, render } from 'lit-html'
import SimpleClient from 'sparql-http-client/SimpleClient'
import { Generator } from 'sparqljs'
import '@rdfjs-elements/sparql-editor/sparql-editor.js'
import { SparqlMarker } from '../../../hooks/useDataLoaderUtils/parser'

export async function fetchData(source) {
  const sparqlGenerator = new Generator()
  const client = new SimpleClient({
    endpointUrl: source.url,
  })
  const response = await client.query.select(
    sparqlGenerator.stringify(source.query)
  )
  const results = await response.json()
  const rows = bindingsToJson(results.head.vars, results.results.bindings)
  rows[SparqlMarker] = true
  return rows
}

export default function SparqlFetch({
  userInput,
  setUserInput,
  setLoadingError,
}) {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const [parsedQuery, setParsedQuery] = useState(null)

  const editorDomRef = useRef()

  const onQueryParsed = useCallback((evt) => {
    const { query } = evt.detail
    if (query.queryType === 'SELECT') {
      setParsedQuery(query)
    } else {
      setParsedQuery(null)
    }
  }, [])

  const onParserFailure = useCallback(() => {
    console.log('parser failed')
    setParsedQuery(null)
  }, [])

  const onSubmit = useCallback(() => {
    const source = {
      type: 'sparql',
      url,
      query: parsedQuery,
    }
    fetchData(source)
      .then((result) => {
        setUserInput(result, {
          type: 'sparql',
          url,
          query: parsedQuery,
        })
      })
      .catch((err) => {
        setLoadingError(t('sparql.error'))
      })
  }, [parsedQuery, setLoadingError, setUserInput, url])

  useEffect(() => {
    const node = editorDomRef.current
    render(
      html`<sparql-editor
        auto-parse
        @parsed=${onQueryParsed}
        @parsing-failed=${onParserFailure}
      ></sparql-editor>`,
      node
    )
  }, [onQueryParsed, onParserFailure])

  return (
    <>
      <div className={classNames(S['base-iri-input-here'])}>
        <span>{t('sparql.baseIri')}</span>
      </div>
      <input
        className={classNames('w-100', S['url-input'])}
        value={url}
        onChange={(e) => {
          setUrl(e.target.value)
        }}
      />
      <div className={classNames(S['query-input-here'])}>
        <span>{t('sparql.queryHere')}</span>
      </div>
      <div ref={editorDomRef} />
      <div className="text-right">
        <button
          className="btn btn-sm btn-success mt-3"
          disabled={!parsedQuery || !url}
          onClick={onSubmit}
        >
          {t('sparql.execute')}
        </button>
      </div>
    </>
  )
}

function bindingsToJson(varNames, bindings) {
  const result = []
  for (const binding of bindings) {
    const row = {}
    for (const variable of varNames) {
      const term = binding[variable]
      if (!term) {
        row[variable] = ''
      } else {
        row[variable] = term.value
      }
    }
    result.push(row)
  }
  return result
}
