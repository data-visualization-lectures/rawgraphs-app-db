import React from 'react'
import { get } from 'lodash'

export default function ParsingErrorMessage({ data, t }) {
  const errors = get(data, 'errors', [])
  const successRows = data.dataset.length - errors.length
  const row = errors[0].row + 1
  const column = Object.keys(errors[0].error)[0]

  return (
    <span>
      <span className="font-weight-bold">
        {row} {t('dataLoader.error.rowUnit', { defaultValue: '行目' })}
      </span>
      {t('dataLoader.error.of', { defaultValue: 'の' })}
      <span className="font-weight-bold">
        {column} {t('dataLoader.error.colUnit', { defaultValue: '列' })}
      </span>
      {t('dataLoader.error.check', {
        defaultValue: 'を確認してください。',
      })}{' '}
      {errors.length === 2 && (
        <>
          {' '}
          <span className="font-weight-bold">{errors[1].row + 1}</span>
          {t('dataLoader.error.anotherRow', {
            defaultValue: '行目にも別の問題があります。',
          })}{' '}
        </>
      )}
      {errors.length > 2 && (
        <>
          {' '}
          {t('dataLoader.error.otherPrefix', { defaultValue: '他 ' })}
          <span className="font-weight-bold">{errors.length - 1}</span>
          {t('dataLoader.error.otherSuffix', {
            defaultValue: ' 行に問題があります。',
          })}{' '}
        </>
      )}
      {successRows > 0 && (
        <>
          {t('dataLoader.error.remainingPrefix', {
            defaultValue: '残りの ',
          })}
          <span className="font-weight-bold">
            {successRows}{' '}
            {t('dataLoader.error.remainingUnit', { defaultValue: '行' })}
          </span>{' '}
          {t('dataLoader.error.remainingSuffix', {
            defaultValue: 'は正常に読み込めました。',
          })}
        </>
      )}
    </span>
  )
}
