import React, { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import S from './UrlFetch.module.scss'

export async function fetchData(source) {
  const response = await fetch(source.url)
  const text = await response.text()
  return text
}

export default function UrlFetch({ userInput, setUserInput, setLoadingError }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')

  const fetchUrl = async (url) => {
    const source = { type: 'url', url }
    let data
    try {
      data = await fetchData(source)
      setUserInput(data, source)
      setLoadingError(null)
    } catch (e) {
      setLoadingError(t('urlFetch.error') + e.message)
    }
  }
  return (
    <input
      className={classNames('w-100', S['url-input'])}
      value={url}
      onChange={(e) => {
        setUrl(e.target.value)
        fetchUrl(e.target.value)
      }}
    />
  )
}
