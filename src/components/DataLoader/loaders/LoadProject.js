import React, { useCallback } from 'react'
import { Button } from 'react-bootstrap'
import { useDropzone } from 'react-dropzone'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import S from './LoadProject.module.scss'
import { deserializeProject } from '@rawgraphs/rawgraphs-core'
import charts from '../../../charts'


export default function LoadProject({ onProjectSelected, setLoadingError }) {
  const { t } = useTranslation()
  const onDrop = useCallback(
    (acceptedFiles) => {
      const reader = new FileReader()
      reader.addEventListener('load', (e) => {
        try {
          const project = deserializeProject(e.target.result, charts)
          setLoadingError(null)
          onProjectSelected(project)
        } catch (e) {
          setLoadingError(e.message)
        }
      })
      if (acceptedFiles.length) {
        reader.readAsText(acceptedFiles[0])
      }
    },
    [onProjectSelected, setLoadingError]
  )
  const {
    getRootProps,
    getInputProps,
    isDragReject,
    isDragAccept,
  } = useDropzone({
    onDrop,
    accept: '.rawgraphs',
    maxFiles: 1,
  })
  return (
    <div
      className={classNames(S.dropzone, {
        [S.reject]: isDragReject,
        [S.accept]: isDragAccept,
      })}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <span>{t('uploadFile.drag')}</span>
      <span>{t('uploadFile.dialog')}</span>
      <Button className={S['browse-button']} color="primary">
        {t('uploadFile.browse')}
      </Button>
      {isDragAccept && <p>{t('uploadFile.accepted')}</p>}
      {isDragReject && <p>{t('uploadFile.rejected')}</p>}
    </div>
  )
}
