import styles from './PartitionView.module.css'

const PARTITION_COUNT = 3

function hashKey(key) {
  if (!key) return 0
  let h = 0
  for (const c of key) h = (Math.imul(31, h) + c.charCodeAt(0)) >>> 0
  return h % PARTITION_COUNT
}

export default function PartitionView({ messages }) {
  const byPartition = Array.from({ length: PARTITION_COUNT }, (_, i) =>
    messages.filter(m => m.partition === i)
  )

  const totals = byPartition.map(p => p.length)
  const max = Math.max(1, ...totals)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Partition Distribution</h2>
        <span className={styles.pill}>Topic: orders</span>
      </div>
      <p className={styles.sub}>
        Kafka uses <code className={styles.code}>hash(key) % numPartitions</code> to route messages.
        Since the key is <code className={styles.code}>orderId</code>, same IDs always land in the same partition.
      </p>

      <div className={styles.partitions}>
        {byPartition.map((msgs, i) => (
          <div key={i} className={styles.partition}>
            <div className={styles.partHeader}>
              <span className={styles.partLabel}>Partition {i}</span>
              <span className={styles.partCount}>{msgs.length} msg{msgs.length !== 1 ? 's' : ''}</span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${(totals[i] / max) * 100}%` }}
              />
            </div>
            <div className={styles.offsets}>
              {msgs.slice(0, 6).map((m, j) => (
                <div key={j} className={styles.offset}>
                  <span className={styles.offsetNum}>@{m.offset}</span>
                  <span className={styles.offsetKey}>{m.key ?? '(null)'}</span>
                </div>
              ))}
              {msgs.length > 6 && (
                <span className={styles.more}>+{msgs.length - 6} more</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.balanceRow}>
        <span className={styles.balanceLabel}>Balance score</span>
        <BalanceBar counts={totals} />
      </div>
    </div>
  )
}

function BalanceBar({ counts }) {
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return <span className={styles.na}>—</span>
  const expected = total / counts.length
  const score = Math.round(100 - (Math.max(...counts) - Math.min(...counts)) / expected * 33)
  const clamped = Math.max(0, Math.min(100, score))
  const color = clamped > 80 ? '#22c55e' : clamped > 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className={styles.balanceTrack}>
      <div className={styles.balanceFill} style={{ width: `${clamped}%`, background: color }} />
      <span className={styles.balanceScore} style={{ color }}>{clamped}%</span>
    </div>
  )
}
