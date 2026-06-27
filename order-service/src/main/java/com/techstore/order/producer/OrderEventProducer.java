package com.techstore.order.producer;

import com.techstore.order.event.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrderEventProducer {

    private static final Logger log = LoggerFactory.getLogger(OrderEventProducer.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.order-created}")          private String orderCreatedTopic;
    @Value("${app.kafka.topics.order-cancelled}")        private String orderCancelledTopic;
    @Value("${app.kafka.topics.order-return-requested}") private String orderReturnRequestedTopic;
    @Value("${app.kafka.topics.refund-issued}")          private String refundIssuedTopic;
    @Value("${app.kafka.topics.inventory-released}")     private String inventoryReleasedTopic;
    @Value("${app.kafka.topics.order-status-updated}")   private String orderStatusUpdatedTopic;

    public OrderEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishOrderCreated(OrderCreatedEvent e) {
        kafkaTemplate.send(orderCreatedTopic, e.getOrderId(), e);
        log.info("Published OrderCreated {}", e.getOrderId());
    }
    public void publishOrderCancelled(OrderCancelledEvent e) {
        kafkaTemplate.send(orderCancelledTopic, e.getOrderId(), e);
    }
    public void publishInventoryReleased(InventoryReleasedEvent e) {
        kafkaTemplate.send(inventoryReleasedTopic, e.getOrderId(), e);
    }
    public void publishOrderReturnRequested(OrderReturnRequestedEvent e) {
        kafkaTemplate.send(orderReturnRequestedTopic, e.getOrderId(), e);
        log.info("Published OrderReturnRequested {}", e.getOrderId());
    }
    public void publishRefundIssued(RefundIssuedEvent e) {
        kafkaTemplate.send(refundIssuedTopic, e.getOrderId(), e);
        log.info("Published RefundIssued {} amount R{}", e.getOrderId(), e.getRefundAmount());
    }
    public void publishOrderStatusUpdated(OrderStatusUpdatedEvent e) {
        kafkaTemplate.send(orderStatusUpdatedTopic, e.getOrderId(), e);
    }
}
