import { useState, useEffect } from 'react'
import styles from './TopologyDiagram.module.css'

export default function TopologyDiagram({ messageCount }) {
  const [pulse, setPulse] = useState(false)
  const prevRef = { current: 0 }

  useEffect(() => {
    if (messageCount > 0) {
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 600)
      return () => clearTimeout(t)
    }
  }, [messageCount])

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Kafka Topology</h2>
      <div className={styles.diagram}>
        {/* Producer */}
        <div className={styles.node}>
          <div className={`${styles.nodeBox} ${styles.producer}`}>
            <span className={styles.nodeIcon}>⬆</span>
            <span className={styles.nodeLabel}>Producer</span>
            <span className={styles.nodeSub}>OrderProducer</span>
          </div>
        </div>

        {/* Arrow → Kafka */}
        <div className={styles.arrow}>
          <div className={`${styles.arrowLine} ${pulse ? styles.pulseAnim : ''}`} />
          <span className={styles.arrowLabel}>key=orderId</span>
        </div>

        {/* Kafka Broker */}
        <div className={styles.node}>
          <div className={`${styles.nodeBox} ${styles.broker}`}>
            <span className={styles.nodeIcon}>⬡</span>
            <span className={styles.nodeLabel}>Kafka Broker</span>
            <span className={styles.nodeSub}>localhost:9092</span>
            <div className={styles.partitionBadges}>
              <span className={styles.badge}>P0</span>
              <span className={styles.badge}>P1</span>
              <span className={styles.badge}>P2</span>
            </div>
          </div>
        </div>

        {/* Arrow → Consumer */}
        <div className={styles.arrow}>
          <div className={`${styles.arrowLine} ${pulse ? styles.pulseAnim : ''}`} />
          <span className={styles.arrowLabel}>poll()</span>
        </div>

        {/* Consumer */}
        <div className={styles.node}>
          <div className={`${styles.nodeBox} ${styles.consumer}`}>
            <span className={styles.nodeIcon}>⬇</span>
            <span className={styles.nodeLabel}>Consumer</span>
            <span className={styles.nodeSub}>OrderConsumer</span>
            <span className={styles.nodeSub}>group: kafka-training-group</span>
          </div>
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendRow}>
          <span className={styles.legendDot} style={{background:'#818cf8'}} />
          <span>Topic: <b>orders</b> — 3 partitions, replication factor 1</span>
        </div>
        <div className={styles.legendRow}>
          <span className={styles.legendDot} style={{background:'#22c55e'}} />
          <span>Messages delivered: <b>{messageCount}</b></span>
        </div>
      </div>
    </div>
  )
}
