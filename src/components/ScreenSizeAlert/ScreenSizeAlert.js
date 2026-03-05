import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useWindowSize from '../../hooks/useWindowSize'
import { Modal, Button } from 'react-bootstrap'


// import styles from './ScreenSizeAlert.module.scss'

function ScreenSizeAlert() {
  const { t } = useTranslation()
  const size = useWindowSize()
  const [showModal, setShowModal] = useState(size.width < 992)
  const [modalWasClosed, setModalWasClosed] = useState(false)

  const handleClose = () => {
    setShowModal(false)
    setModalWasClosed(true)
  }

  useEffect(() => {
    if (modalWasClosed === false) {
      setShowModal(size.width < 992)
    }
  }, [modalWasClosed, size])

  return (
    <Modal
      className="raw-modal"
      show={showModal}
      onHide={handleClose}
      backdrop="static"
      keyboard={false}
      // size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title as="h5">
          <span role="img" aria-label="Party icon">
            🎉
          </span>{' '}
          {t('screenSizeAlert.title')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="big">{t('screenSizeAlert.body1')}</p>
        <p>{t('screenSizeAlert.body2')}</p>
        <p>{t('screenSizeAlert.body3')}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          {t('screenSizeAlert.ok')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ScreenSizeAlert
