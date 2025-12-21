import React, { useState, useEffect } from 'react'
import useWindowSize from '../../hooks/useWindowSize'
import { Modal, Button } from 'react-bootstrap'


// import styles from './ScreenSizeAlert.module.scss'

function ScreenSizeAlert() {
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
          RAWGraphsへようこそ！
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="big">RAWGraphs 2.0は、より大きな画面向けに設計されています。</p>
        <p>ブラウザ・ウィンドウのサイズを変更してご利用ください。</p>
        <p>タッチ・デバイスはまだ完全にはサポートされていません。</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          わかりました
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ScreenSizeAlert
