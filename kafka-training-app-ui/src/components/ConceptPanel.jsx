import { useState } from 'react'
import styles from './ConceptPanel.module.css'

const CONCEPTS = [
  // ── Core fundamentals ────────────────────────────────────────────────────
  {
    id: 'broker',
    label: 'Broker',
    icon: '⬡',
    color: '#f59e0b',
    category: 'Core',
    summary: 'A Kafka broker is a server that stores and serves messages.',
    detail: `A Kafka cluster consists of one or more brokers. Each broker:
• Stores messages on disk in append-only log files
• Handles read and write requests from producers and consumers
• Manages its assigned partition replicas
• In KRaft mode (used here), one broker also acts as the cluster controller

In this training app, Kafka runs on localhost:9092 (single-node via Docker).`,
    code: `# Start Kafka (from kafka-training directory)
docker-compose up -d

# Check broker health
docker exec kafka kafka-topics.sh \\
  --bootstrap-server localhost:9092 --list`
  },
  {
    id: 'topic',
    label: 'Topic',
    icon: '≡',
    color: '#818cf8',
    category: 'Core',
    summary: 'A topic is a named, ordered, immutable log of records.',
    detail: `Topics are the fundamental unit of organisation in Kafka:
• Messages are always appended — never updated or deleted in-place
• Consumers read from a position called an offset
• Retention is time-based (default 7 days) or size-based
• Topics are split into partitions for parallelism

This online store uses 13 topics: order.created, order.cancelled, inventory.reserved, payment.completed and more.`,
    code: `# Describe a topic
docker exec kafka kafka-topics.sh \\
  --bootstrap-server localhost:9092 \\
  --describe --topic order.created

# List all topics
docker exec kafka kafka-topics.sh \\
  --bootstrap-server localhost:9092 --list`
  },
  {
    id: 'partition',
    label: 'Partition',
    icon: '▤',
    color: '#22c55e',
    category: 'Core',
    summary: 'Partitions enable horizontal scaling and parallel consumption.',
    detail: `Each topic is split into partitions:
• Messages within a partition are strictly ordered
• Different partitions can live on different brokers
• A consumer in a group gets assigned one or more partitions
• The number of partitions sets the maximum parallelism

Routing: if a key is provided, Kafka uses murmur2(key) % numPartitions. The same orderId always lands in the same partition — guaranteeing order for a given order's events.`,
    code: `// OrderEventProducer.java — key = orderId ensures ordering
kafkaTemplate.send(orderCreatedTopic, event.getOrderId(), event);
//                                    ^^^^^^^^^^^^^^^^^ partition key`
  },
  {
    id: 'producer',
    label: 'Producer',
    icon: '⬆',
    color: '#34d399',
    category: 'Core',
    summary: 'Producers write (produce) messages to Kafka topics.',
    detail: `Spring Boot producer setup:
• KafkaTemplate<K,V> is the main abstraction
• send() is async — returns a CompletableFuture<SendResult>
• acks config controls durability: acks=all means all ISR replicas confirm
• value-serializer: JsonSerializer serialises Java objects to JSON automatically

The order-service produces to order.created, order.cancelled, order.status.updated and more.`,
    code: `// OrderEventProducer.java
@Service
public class OrderEventProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishOrderCreated(OrderCreatedEvent event) {
        kafkaTemplate.send(orderCreatedTopic,
                           event.getOrderId(), // key
                           event);             // value (auto JSON)
    }
}`
  },
  {
    id: 'consumer',
    label: 'Consumer',
    icon: '⬇',
    color: '#60a5fa',
    category: 'Core',
    summary: 'Consumers read (consume) messages and track their offset.',
    detail: `Spring Boot consumer setup:
• @KafkaListener annotation turns a method into a consumer
• groupId controls which consumer group this instance belongs to
• auto-offset-reset: earliest means start from the beginning if no committed offset
• value-deserializer: JsonDeserializer deserialises JSON back to Java objects automatically

Consumers in the same group share partitions — adding more instances scales throughput up to the number of partitions.`,
    code: `// InventoryEventConsumer.java
@Service
public class InventoryEventConsumer {

  @KafkaListener(
    topics = "\${app.kafka.topics.order-created}",
    groupId = "\${spring.kafka.consumer.group-id}"
  )
  public void onOrderCreated(OrderCreatedEvent event) {
    inventoryService.processOrderCreated(event);
  }
}`
  },
  {
    id: 'offset',
    label: 'Offset',
    icon: '#',
    color: '#e879f9',
    category: 'Core',
    summary: 'An offset is the position of a message within a partition.',
    detail: `Offsets are monotonically increasing integers starting at 0 per partition:
• Kafka stores committed offsets in the internal __consumer_offsets topic
• Consumers commit their offset after processing (auto or manual)
• You can seek to any offset — replay old messages or skip ahead
• If a consumer crashes and restarts, it resumes from its last committed offset

auto.offset.reset=earliest means a fresh consumer group reads from offset 0.`,
    code: `# Consume from the beginning (offset 0)
docker exec kafka kafka-console-consumer.sh \\
  --bootstrap-server localhost:9092 \\
  --topic order.created \\
  --from-beginning`
  },
  {
    id: 'consumergroup',
    label: 'Consumer Group',
    icon: '👥',
    color: '#f472b6',
    category: 'Core',
    summary: 'A group of consumers sharing partitions for parallel processing.',
    detail: `Consumer groups are Kafka's scalability unit on the read side:
• Each partition is assigned to exactly ONE consumer in the group
• Adding consumers up to partitionCount increases throughput linearly
• Each group maintains independent offsets — multiple groups = multiple independent reads
• Rebalancing happens automatically when consumers join or leave

This app has 5 consumer groups: order-service-group, inventory-service-group, payment-service-group, dispatch-service-group, notification-service-group.`,
    code: `# View consumer group lag
docker exec kafka kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 \\
  --group order-service-group --describe`
  },

  // ── Architecture patterns ────────────────────────────────────────────────
  {
    id: 'event-driven',
    label: 'Event-Driven Architecture',
    icon: '⚡',
    color: '#f97316',
    category: 'Architecture',
    summary: 'Services communicate by publishing and reacting to events rather than direct calls.',
    detail: `In event-driven architecture, services don't call each other directly. Instead:
• A service publishes an event when something happens ("order created")
• Other services subscribe and react independently ("reserve stock", "notify customer")
• Services are decoupled — neither knows the other exists
• Adding a new service means subscribing to existing events, not changing publishers

Benefits: loose coupling, independent scaling, resilience, audit trail.

This app is fully event-driven. The order-service never calls inventory-service directly — it just fires order.created.`,
    code: `// No REST calls between services — only events
// order-service publishes:
kafkaTemplate.send("order.created", orderId, event);

// inventory-service reacts independently:
@KafkaListener(topics = "order.created")
public void onOrderCreated(OrderCreatedEvent e) {
    // Reserves stock and fires inventory.reserved
}`
  },
  {
    id: 'saga',
    label: 'Saga Pattern',
    icon: '↩',
    color: '#f43f5e',
    category: 'Architecture',
    summary: 'A sequence of local transactions coordinated by events, with compensating transactions on failure.',
    detail: `The Saga pattern solves distributed transactions without a 2-phase commit:
• Each step is a local transaction in one service
• On success, the service publishes an event that triggers the next step
• On failure, compensating transactions undo previous steps

This app implements a Choreography Saga (no central coordinator):
1. order.created → inventory reserves stock
2. inventory.reserved → payment charges card
3. payment.failed → inventory.released (stock returned — compensating transaction)
4. order.cancelled → inventory.released (stock returned)

The "stock release" is the compensating transaction — it undoes the reservation.`,
    code: `// payment-service publishes payment.failed
// order-service listens and triggers the compensation:
@Transactional
public void handlePaymentFailed(PaymentFailedEvent event) {
    // Compensating transaction: release reserved stock
    producer.publishInventoryReleased(
        new InventoryReleasedEvent(event.getOrderId(), order.getItems())
    );
}

// inventory-service restores stock:
@KafkaListener(topics = "inventory.released")
public void onInventoryReleased(InventoryReleasedEvent event) {
    inventoryService.releaseStock(event.getOrderId(), event.getItems());
}`
  },
  {
    id: 'circuit-breaker',
    label: 'Circuit Breaker',
    icon: '⚡',
    color: '#ef4444',
    category: 'Architecture',
    summary: 'A resilience pattern that stops calling a failing service to give it time to recover.',
    detail: `The Circuit Breaker has three states:
• CLOSED: everything works — requests pass through normally
• OPEN: too many failures — requests are rejected immediately (fail-fast)
• HALF_OPEN: recovery test — one request is let through to check if the service recovered

Benefits:
• Prevents cascade failures across services
• Gives the failing downstream service time to recover
• Returns fast errors instead of slow timeouts

In this app, payment-service has a circuit breaker. After 3 consecutive payment failures, it opens and all new payments immediately fail with "Payment gateway unavailable".`,
    code: `// CircuitBreaker.java
public void recordFailure() {
    int failures = consecutiveFailures.incrementAndGet();
    if (failures >= failureThreshold && state == State.CLOSED) {
        state = State.OPEN;
        openedAt = Instant.now();
    }
}

public boolean isOpen() {
    if (state == State.OPEN) {
        // Check if recovery timeout elapsed → HALF_OPEN
        if (Instant.now().isAfter(openedAt.plusSeconds(recoveryTimeout))) {
            state = State.HALF_OPEN;
            return false;
        }
        return true; // fast-fail
    }
    return false;
}`
  },
  {
    id: 'dead-letter-queue',
    label: 'Dead Letter Queue',
    icon: '💀',
    color: '#6b7280',
    category: 'Architecture',
    summary: 'A topic where messages land when they cannot be processed after all retries.',
    detail: `When a consumer fails to process a message repeatedly:
• Kafka retries N times (configurable backoff)
• After all retries, the message is moved to a DLQ topic (e.g. payment.dlq)
• The original topic continues processing other messages
• Ops teams can inspect, fix, and replay DLQ messages later

DLQs prevent one bad message from blocking all downstream processing forever.

In this app, payment.dlq captures messages the payment-service could not process. The notification-service logs them as "⚠ Dead Letter Queue" events in the dashboard.`,
    code: `# Inspect DLQ messages
docker exec kafka kafka-console-consumer.sh \\
  --bootstrap-server localhost:9092 \\
  --topic payment.dlq \\
  --from-beginning

# Replay a DLQ message back to the original topic
docker exec kafka kafka-console-producer.sh \\
  --bootstrap-server localhost:9092 \\
  --topic payment.completed`
  },
  {
    id: 'event-sourcing',
    label: 'Event Sourcing',
    icon: '📜',
    color: '#8b5cf6',
    category: 'Architecture',
    summary: 'Store the sequence of events that led to the current state, not just the state itself.',
    detail: `With event sourcing, you never update a record in place. Instead:
• Every state change is stored as an immutable event
• The current state is derived by replaying all events
• You get a complete audit log for free
• You can reconstruct any past state by replaying up to a point in time
• You can build new "projections" (read models) by replaying history

The Kafka event stream in this app is a partial event sourcing implementation:
• Every order's Kafka event timeline (order.created → inventory.reserved → payment.completed → order.dispatched → order.delivered) tells the full story of what happened
• The notification-service stores all events — click "Show Kafka event timeline" on any order to see the complete event chain`,
    code: `// Rebuild order state from events
List<StoreEvent> events = eventStore.getOrderEvents(orderId);
// Events: [OrderCreated, InventoryReserved, PaymentCompleted,
//          OrderDispatched, OrderDelivered]

// Each event is immutable — the log IS the source of truth
// Current state = apply(events)`
  },
  {
    id: 'message-replay',
    label: 'Message Replay',
    icon: '⟳',
    color: '#06b6d4',
    category: 'Architecture',
    summary: 'Re-process historical messages from any point in time.',
    detail: `One of Kafka's most powerful features is the ability to replay messages:
• Messages are retained on disk (default 7 days)
• Any consumer group can seek to any offset and re-read from there
• Use cases: rebuilding a database after a bug fix, onboarding a new service, reprocessing after a downstream failure

auto.offset.reset: earliest means new consumer groups start from the very beginning — replaying all history.

In this app, the Dashboard has a "Replay last 5 events" button that re-publishes recent events to *.replay topics — demonstrating how Kafka enables reprocessing without data loss.`,
    code: `# Replay all events from the start for a consumer group
docker exec kafka kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 \\
  --group notification-service-group \\
  --reset-offsets --to-earliest \\
  --topic order.created --execute`
  },
  {
    id: 'serialization',
    label: 'Serialisation',
    icon: '{}',
    color: '#10b981',
    category: 'Advanced',
    summary: 'Converting Java objects to bytes for Kafka and back — JSON vs Avro vs Protobuf.',
    detail: `Kafka messages are just bytes. Serialisation determines how Java objects become bytes:

JSON (used in this app):
• Human-readable, easy to debug with kafka-console-consumer
• No schema enforcement — a field typo causes runtime errors
• Larger payload than binary formats
• Spring's JsonSerializer / JsonDeserializer handles it automatically

Avro (production standard):
• Binary format — much smaller payloads
• Schema enforced by a Schema Registry
• Schema evolution: can add/remove fields with compatibility rules
• Used in high-throughput production systems

Protobuf:
• Also binary with schema enforcement
• Faster serialisation than Avro
• Used heavily at Google, increasingly in Kafka ecosystems`,
    code: `# application.yml — JSON serialisation config
spring:
  kafka:
    producer:
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    consumer:
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "com.techstore.*"

# With JsonDeserializer, Kafka knows which class to deserialise to
# because the type info is embedded in the message headers`
  },
  {
    id: 'replication',
    label: 'Replication',
    icon: '⎘',
    color: '#fbbf24',
    category: 'Advanced',
    summary: 'Partition replicas across brokers provide fault tolerance and high availability.',
    detail: `Each partition can have multiple replicas across brokers:
• Leader replica: handles all reads and writes
• Follower replicas: copy data from the leader (ISR = In-Sync Replicas)
• If the leader fails, a follower is elected as the new leader automatically

Replication factor = how many copies of each partition exist.

Configuration:
• replication.factor=1 (this training app — single broker, no redundancy)
• replication.factor=3 (typical production — can lose 2 brokers and still work)
• min.insync.replicas=2 with acks=all guarantees a message is on 2 replicas before acking

In this single-node Docker setup, replication.factor=1 is fine — but in production this would be 3.`,
    code: `# Create a topic with 3 replicas (needs 3 brokers)
docker exec kafka kafka-topics.sh \\
  --bootstrap-server localhost:9092 \\
  --create --topic order.created \\
  --partitions 3 \\
  --replication-factor 3

# Check ISR (In-Sync Replicas) health
docker exec kafka kafka-topics.sh \\
  --bootstrap-server localhost:9092 \\
  --describe --topic order.created`
  },
  {
    id: 'kraft',
    label: 'KRaft Mode',
    icon: '⚙',
    color: '#a78bfa',
    category: 'Advanced',
    summary: 'Kafka without ZooKeeper — self-managed metadata using the Raft consensus algorithm.',
    detail: `Historically, Kafka required Apache ZooKeeper to manage cluster metadata:
• ZooKeeper stored broker registrations, partition leadership, consumer offsets
• It was a separate system to deploy, monitor and maintain
• It became a bottleneck for large clusters

KRaft (Kafka Raft) replaces ZooKeeper entirely:
• Metadata is stored in a special internal Kafka topic (__cluster_metadata)
• One broker is elected as the controller using the Raft consensus algorithm
• No external dependency — simpler deployment
• Supports much larger clusters (millions of partitions)

This training app uses KRaft mode (apache/kafka:latest image) — no ZooKeeper container needed!`,
    code: `# docker-compose.yml — KRaft configuration
environment:
  KAFKA_NODE_ID: 1
  KAFKA_PROCESS_ROLES: broker,controller  # same node does both
  KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
  KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER

# No ZooKeeper service needed!
# Compare to old-style setup which required:
# zookeeper:
#   image: confluentinc/cp-zookeeper:latest`
  },
  {
    id: 'idempotency',
    label: 'Idempotency',
    icon: '=',
    color: '#ec4899',
    category: 'Advanced',
    summary: 'Processing the same message more than once produces the same result as processing it once.',
    detail: `In distributed systems, messages can be delivered more than once:
• At-least-once delivery: messages may be duplicated (Kafka's default)
• At-most-once delivery: messages may be lost
• Exactly-once: messages processed exactly once (complex, expensive)

Making consumers idempotent is the practical solution:
• Store processed message IDs and skip duplicates
• Use database upserts instead of inserts
• Design operations that are safe to repeat (e.g. "set stock to 5" vs "subtract 1 from stock")

Producer idempotency (enable.idempotence=true):
• Kafka assigns a sequence number to each message
• The broker deduplicates retries from the same producer
• Prevents duplicate messages even when the producer retries after a network error`,
    code: `# application.yml — enable producer idempotence
spring:
  kafka:
    producer:
      properties:
        enable.idempotence: true
        acks: all
        retries: 3

// Consumer-side idempotency example:
public void onOrderCreated(OrderCreatedEvent event) {
    // Skip if already processed (idempotent check)
    if (orderRepository.existsById(event.getOrderId())) return;
    // Process...
}`
  },
  {
    id: 'backpressure',
    label: 'Back-pressure',
    icon: '⏸',
    color: '#64748b',
    category: 'Advanced',
    summary: 'How Kafka handles fast producers overwhelming slow consumers.',
    detail: `Kafka is designed to handle mismatched producer/consumer speeds gracefully:

Producer side:
• Messages accumulate in the topic log on disk
• Producers are never blocked waiting for slow consumers
• Retention policy determines how long messages are kept

Consumer side:
• Consumers read at their own pace
• Consumer lag = how far behind a consumer is (measurable via consumer group offset)
• Adding more consumers (up to partition count) increases processing throughput
• max.poll.records controls how many messages are fetched per poll

This decoupling is one of Kafka's core strengths — during a traffic spike, orders still get created and Kafka buffers them, then inventory/payment catch up when load normalises.`,
    code: `# Monitor consumer lag (how far behind a group is)
docker exec kafka kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 \\
  --group order-service-group \\
  --describe

# Output shows LAG column — 0 means caught up
# TOPIC          PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
# order.created  0          47              47              0`
  },
]

const CATEGORIES = ['Core', 'Architecture', 'Advanced']

export default function ConceptPanel() {
  const [active,    setActive]    = useState(CONCEPTS[0].id)
  const [filterCat, setFilterCat] = useState('All')
  const concept = CONCEPTS.find(c => c.id === active)

  const visible = filterCat === 'All'
    ? CONCEPTS
    : CONCEPTS.filter(c => c.category === filterCat)

  return (
    <div className={styles.root}>

      {/* ── Mobile concept picker (select dropdown) — hidden on desktop ── */}
      <div className={styles.mobilePicker}>
        <label className={styles.mobilePickerLabel}>Kafka Concept</label>
        <select
          className={styles.mobileSelect}
          value={active}
          onChange={e => setActive(e.target.value)}
          aria-label="Select a Kafka concept"
        >
          {CATEGORIES.map(cat => (
            <optgroup key={cat} label={cat}>
              {CONCEPTS.filter(c => c.category === cat).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* ── Desktop sidebar — hidden on mobile ── */}
      <div className={styles.sidebar}>
        <div className={styles.sideTitle}>Kafka Concepts</div>

        {/* Category filter */}
        <div className={styles.catFilter}>
          {['All', ...CATEGORIES].map(cat => (
            <button key={cat}
              className={`${styles.catBtn} ${filterCat === cat ? styles.catBtnActive : ''}`}
              onClick={() => setFilterCat(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* Concept list */}
        {CATEGORIES.filter(cat => filterCat === 'All' || cat === filterCat).map(cat => {
          const items = visible.filter(c => c.category === cat)
          if (!items.length) return null
          return (
            <div key={cat}>
              <div className={styles.catLabel}>{cat}</div>
              {items.map(c => (
                <button
                  key={c.id}
                  className={`${styles.sideItem} ${active === c.id ? styles.sideItemActive : ''}`}
                  onClick={() => setActive(c.id)}
                  style={active === c.id ? { borderColor: c.color, color: c.color } : {}}
                >
                  <span className={styles.sideIcon}>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          )
        })}

        <div className={styles.sideCount}>{CONCEPTS.length} concepts</div>
      </div>

      <div className={styles.content}>
        <div className={styles.conceptHeader}>
          <span className={styles.conceptIcon} style={{ color: concept.color, background: concept.color + '22' }}>
            {concept.icon}
          </span>
          <div>
            <div className={styles.conceptCat}>{concept.category}</div>
            <h1 className={styles.conceptTitle}>{concept.label}</h1>
            <p className={styles.conceptSummary}>{concept.summary}</p>
          </div>
        </div>

        <div className={styles.detail}>
          {concept.detail.split('\n').map((line, i) => (
            <p key={i} className={line.startsWith('•') ? styles.bullet : styles.para}>
              {line.startsWith('•') ? line.slice(1).trim() : line}
            </p>
          ))}
        </div>

        <div className={styles.codeBlock}>
          <div className={styles.codeHeader}>
            <span className={styles.codeDot} style={{ background: '#ef4444' }} />
            <span className={styles.codeDot} style={{ background: '#f59e0b' }} />
            <span className={styles.codeDot} style={{ background: '#22c55e' }} />
            <span className={styles.codeTitle}>Example</span>
          </div>
          <pre className={styles.code}>{concept.code}</pre>
        </div>
      </div>
    </div>
  )
}
