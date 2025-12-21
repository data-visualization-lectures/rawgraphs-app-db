import React from 'react'
import styles from './Footer.module.scss'
import { Row, Col, Container } from 'react-bootstrap'


// #TODO add commit hash
// const commitHash = process.env.REACT_APP_VERSION || 'dev'

export default function Footer(props) {
  return (
    <Container fluid style={{ backgroundColor: 'var(--dark)' }}>
      <Container className={styles.footer}>
        <Row>
          <Col xs={12}>
            <p className="Xsmall" style={{ marginBottom: 0 }}>
              RAWGraphs is designed and developed by DensityDesign, Calibro and Inmagik.<br />
              © 2013-2021 Apache License 2.0
            </p>
          </Col>
        </Row>
      </Container>
    </Container >
  )
}
