import React from 'react'
import styles from './FixedHeader.module.scss'

export default function FixedHeader() {
    return (
        <div className={styles.header}>
            <span className={styles.title}>RawGraphs</span>
        </div>
    )
}
