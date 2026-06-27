package com.techstore.notification.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.techstore.notification.store.EmailStore;
import com.techstore.notification.store.EventStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;

@Service
public class StoreEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(StoreEventConsumer.class);
    private final EventStore eventStore;
    private final EmailStore emailStore;

    public StoreEventConsumer(EventStore eventStore, EmailStore emailStore) {
        this.eventStore = eventStore; this.emailStore = emailStore;
    }

    @KafkaListener(topics = "${app.kafka.topics.order-created}", groupId = "${spring.kafka.consumer.group-id}")
    public void onOrderCreated(JsonNode p, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String orderId = g(p, "orderId"); double total = p.path("totalAmount").asDouble();
        eventStore.add(topic, "OrderCreated", orderId, "New order placed",
                "Customer " + g(p,"customerEmail") + " placed order " + orderId + " for R" + f(total), "INFO");
        emailStore.upsert(orderId, p, "PENDING");
    }

    @KafkaListener(topics = "${app.kafka.topics.order-cancelled}", groupId = "${spring.kafka.consumer.group-id}")
    public void onOrderCancelled(JsonNode p, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String orderId = g(p,"orderId");
        eventStore.add(topic, "OrderCancelled", orderId, "Order cancelled", "Order " + orderId + " cancelled: " + g(p,"reason"), "FAILURE");
        emailStore.upsert(orderId, p, "CANCELLED");
    }

    @KafkaListener(topics = "${app.kafka.topics.order-dispatched}", groupId = "${spring.kafka.consumer.group-id}")
    public void onOrderDispatched(JsonNode p, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String orderId = g(p,"orderId"); String courier = g(p,"courier"); String tracking = g(p,"trackingNumber");
        eventStore.add(topic, "OrderDispatched", orderId, "Order dispatched 🚚",
                "Order " + orderId + " dispatched via " + courier + " · tracking: " + tracking, "SUCCESS");
        emailStore.upsert(orderId, p, "DISPATCHED");
    }

    @KafkaListener(topics = "${app.kafka.topics.order-delivered}", groupId = "${spring.kafka.consumer.group-id}")
    public void onOrderDelivered(JsonNode p, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String orderId = g(p,"orderId");
        eventStore.add(topic, "OrderDelivered", orderId, "Order delivered ✅",
                "Order " + orderId + " has been delivered — tracking: " + g(p,"trackingNumber"), "SUCCESS");
        emailStore.upsert(orderId, p, "DELIVERED");
    }

    @KafkaListener(topics = "${app.kafka.topics.order-return-requested}", groupId = "${spring.kafka.consumer.group-id}")
    public void onOrderReturnRequested(JsonNode p, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String orderId = g(p,"orderId");
        eventStore.add(topic, "OrderReturnRequested", orderId, "Return requested ↩",
                "Customer requested return for order " + orderId + ": " + g(p,"reason"), "INFO");
        emailStore.upsert(orderId, p, "RETURN_REQUESTED");
    }

    @KafkaListener(topics = "${app.kafka.topics.refund-issued}", groupId = "${spring.kafka.consumer.group-id}")
    public void onRefundIssued(JsonNode p, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String orderId = g(p,"orderId"); double amount = p.path("refundAmount").asDouble();
        eventStore.add(topic, "RefundIssued", orderId, "Refund issued 💳",
                "R" + f(amount) + " refunded for order " + orderId + " · ref: " + g(p,"refundReference"), "SUCCESS");
        emailStore.upsert(orderId, p, "RETURNED");
    }

    @KafkaListener(topics = "${app.kafka.topics.inventory-reserved}", groupId = "${spring.kafka.consumer.group-id}")
    public void onInventoryReserved(JsonNode p, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String orderId = g(p,"orderId");
        eventStore.add(topic, "InventoryReserved", orderId, "Stock reserved 📦",
                "All items for order " + orderId + " reserved", "SUCCESS");
        emailStore.upsert(orderId, p, "INVENTORY_RESERVED");
    }

    @KafkaListener(topics = "${app.kafka.topics.inventory-released}", groupId = "${spring.kafka.consumer.group-id}")
    public void onInventoryReleased(JsonNode p, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        eventStore.add(topic, "InventoryReleased", g(p,"orderId"), "Stock released (Saga) ↩",
                "Reserved stock returned to inventory for order " + g(p,"orderId"), "INFO");
    }

    @KafkaListener(topics = "${app.kafka.topics.inventory-failed}", groupId = "${spring.kafka.consumer.group-id}")
    public void onInventoryFailed(JsonNode p, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String orderId = g(p,"orderId");
        eventStore.add(topic, "InventoryFailed", orderId, "Out of stock ❌",
                "Order " + orderId + " failed: " + g(p,"reason"), "FAILURE");
        emailStore.upsert(orderId, p, "FAILED");
    }

    @KafkaListener(topics = "${app.kafka.topics.payment-completed}", groupId = "${spring.kafka.consumer.group-id}")
    public void onPaymentCompleted(JsonNode p, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String orderId = g(p,"orderId"); double amount = p.path("amount").asDouble();
        eventStore.add(topic, "PaymentCompleted", orderId, "Payment approved 💳",
                "R" + f(amount) + " charged · txn " + g(p,"transactionId"), "SUCCESS");
        emailStore.upsert(orderId, p, "PAYMENT_COMPLETED");
    }

    @KafkaListener(topics = "${app.kafka.topics.payment-failed}", groupId = "${spring.kafka.consumer.group-id}")
    public void onPaymentFailed(JsonNode p, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String orderId = g(p,"orderId");
        eventStore.add(topic, "PaymentFailed", orderId, "Payment declined ❌",
                "Order " + orderId + ": " + g(p,"reason") + " — stock will be released", "FAILURE");
        emailStore.upsert(orderId, p, "FAILED");
    }

    @KafkaListener(topics = "${app.kafka.topics.payment-dlq}", groupId = "${spring.kafka.consumer.group-id}")
    public void onPaymentDlq(JsonNode p, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        log.warn("DLQ message received on {}", topic);
        eventStore.add(topic, "DeadLetter", g(p,"orderId"), "⚠ Dead Letter Queue",
                "Message could not be processed and was sent to DLQ: " + p.toString().substring(0, Math.min(120, p.toString().length())), "FAILURE");
    }

    @KafkaListener(topics = "${app.kafka.topics.order-status-updated}", groupId = "${spring.kafka.consumer.group-id}")
    public void onOrderStatusUpdated(JsonNode p, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String status = g(p,"status"); String orderId = g(p,"orderId");
        String evtStatus = switch(status) {
            case "CONFIRMED","DELIVERED","RETURNED" -> "SUCCESS";
            case "FAILED","CANCELLED" -> "FAILURE";
            default -> "INFO";
        };
        eventStore.add(topic, "OrderStatusUpdated", orderId, "Status: " + status, g(p,"message"), evtStatus);
        emailStore.upsert(orderId, p, status);
    }

    private String g(JsonNode n, String f) { return n.path(f).asText("?"); }
    private String f(double v) { return String.format("%.2f", v); }
}
