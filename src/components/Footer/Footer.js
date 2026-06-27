import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Footer.module.scss'
import { Row, Col, Container } from 'react-bootstrap'


export default function Footer(props) {
  const { t } = useTranslation()

  return (
    <Container fluid style={{ backgroundColor: 'var(--dark)' }}>
      <Container className={styles.footer}>
        <Row>
          <Col xs={12}>
            <p className="Xsmall" style={{ marginBottom: 0 }}>
              {t('footer.credits')}<br />
              {t('footer.license')}
            </p>
          </Col>
        </Row>
      </Container>
    </Container >
  )
}
