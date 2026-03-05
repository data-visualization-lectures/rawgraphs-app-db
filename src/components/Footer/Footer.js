import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Footer.module.scss'
import { Row, Col, Container } from 'react-bootstrap'


export default function Footer(props) {
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ja' ? 'en' : 'ja')
  }

  return (
    <Container fluid style={{ backgroundColor: 'var(--dark)' }}>
      <Container className={styles.footer}>
        <Row>
          <Col xs={12} className="d-flex justify-content-between align-items-center">
            <p className="Xsmall" style={{ marginBottom: 0 }}>
              {t('footer.credits')}<br />
              {t('footer.license')}
            </p>
            <button
              onClick={toggleLanguage}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.5)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
            >
              {t('languageSwitcher.label')}
            </button>
          </Col>
        </Row>
      </Container>
    </Container >
  )
}
