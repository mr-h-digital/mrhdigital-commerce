# Start the full TechStore Kafka platform

## Step 1 — Kafka (Docker)
```bash
cd C:\Users\CP346231\Downloads\kafka-training
docker compose up -d
```

## Step 2 — Start each Spring Boot service (separate terminals)
```bash
# Terminal 1 — Product Service  (port 8082)
cd kafka-training\product-service
./mvnw spring-boot:run

# Terminal 2 — Order Service  (port 8083)
cd kafka-training\order-service
./mvnw spring-boot:run

# Terminal 3 — Inventory Service  (port 8084)
cd kafka-training\inventory-service
./mvnw spring-boot:run

# Terminal 4 — Payment Service  (port 8085)
cd kafka-training\payment-service
./mvnw spring-boot:run

# Terminal 5 — Notification Service  (port 8086)
cd kafka-training\notification-service
./mvnw spring-boot:run
```

## Step 3 — Start the two UIs (separate terminals)
```bash
# Store UI  → http://localhost:5174
cd kafka-training\store-ui
npm run dev

# Kafka Training UI  → http://localhost:5173
cd kafka-training\kafka-training-app-ui
npm run dev
```

## URLs
| Service                | URL                          |
|------------------------|------------------------------|
| Store UI               | http://localhost:5174         |
| Kafka Training UI      | http://localhost:5173         |
| Kafka UI (Provectus)   | http://localhost:8080         |
| Product Service        | http://localhost:8082/api/products |
| Order Service          | http://localhost:8083/api/orders   |
| Inventory Service      | http://localhost:8084/api/inventory/stock |
| Notification Service   | http://localhost:8086/api/events   |

## The event flow for each order
1. Customer places order → **order-service** publishes `order.created`
2. **inventory-service** consumes `order.created`, checks stock:
   - Stock OK → publishes `inventory.reserved`
   - Out of stock → publishes `inventory.failed`
3. **payment-service** consumes `inventory.reserved` → publishes `payment.completed` (90%) or `payment.failed` (10%)
4. **order-service** consumes payment result, updates order status, publishes `order.status.updated`
5. **notification-service** consumes ALL topics, stores events in memory
6. Both UIs poll for live updates every 2 seconds
