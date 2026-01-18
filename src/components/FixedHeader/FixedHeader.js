import React from 'react'
import styles from './FixedHeader.module.scss'

export default function FixedHeader() {
    return (
        <div className={styles.header}>
            <span className={styles.title}>
                <img
                    className={styles.logo}
                    src="/logo_rawgraphs.png"
                    alt="RawGraphs"
                />
            </span>
        </div>
    )
}
