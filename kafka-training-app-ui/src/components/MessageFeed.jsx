import { useRef, useEffect, useState } from 'react'
import styles from './MessageFeed.module.css'

const PARTITION_COLORS = ['#818cf8', '#f59e0b', '#22c55e']

export default function MessageFeed({ messages, onClear }) {
  const [filter, setFilter] = useState('')
  const topRef = useRef(null)
  const prevLen = useRef(0)

  useEffect(() => {
    if (messages.length > prevLen.current && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    prevLen.current = messages.length
  }, [messages.length])

  const filtered = filter
    ? messages.filter(m =>
        m.key?.toLowerCase().includes(filter.toLowerCase()) ||
        m.value?.toLowerCase().includes(filter.toLowerCase())
      )
    : messages

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Consumed Messages</h2>
        <div className={styles.actions}>
          <span className={styles.count}>{messages.length} total</span>
          <button className={styles.clearBtn} onClick={onClear} disabled={messages.length === 0}>
            Clear
          </button>
        </div>
      </div>

      <div className={styles.filterRow}>
        <input
          className={styles.filterInput}
          placeholder="Filter by key or value…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      <div className={styles.feed}>
        <div ref={topRef} />
        {filtered.length === 0 && (
          <div className={styles.empty}>
            {messages.length === 0
              ? 'No messages yet — send an order above!'
              : 'No messages match your filter.'}
          </div>
        )}
        {filtered.map((msg, i) => (
          <MessageRow key={`${msg.partition}-${msg.offset}`} msg={msg} isNew={i === 0} />
        ))}
      </div>
    </div>
  )
}

function MessageRow({ msg, isNew }) {
  const [highlight, setHighlight] = useState(isNew)
  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setHighlight(false), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  const color = PARTITION_COLORS[msg.partition % PARTITION_COLORS.length]
  const time = new Date(msg.timestamp).toLocaleTimeString()

  return (
    <div className={`${styles.row} ${highlight ? styles.rowNew : ''}`}>
      <div className={styles.rowLeft}>
        <span className={styles.partBadge} style={{ background: color + '22', color, borderColor: color + '55' }}>
          P{msg.partition}
        </span>
        <div className={styles.rowBody}>
          <div className={styles.rowTop}>
            <span className={styles.key}>{msg.key ?? '(null)'}</span>
            <span className={styles.offset}>offset {msg.offset}</span>
            <span className={styles.time}>{time}</span>
          </div>
          <code className={styles.value}>{msg.value}</code>
        </div>
      </div>
    </div>
  )
}
