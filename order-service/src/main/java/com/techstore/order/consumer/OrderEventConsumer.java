package com.techstore.order.consumer;

import com.techstore.order.event.*;
import com.techstore.order.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class OrderEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderEventConsumer.class);
    private final OrderService orderService;

    public OrderEventConsumer(OrderService orderService) { this.orderService = orderService; }

    @KafkaListener(topics = "${app.kafka.topics.inventory-reserved}", groupId = "${spring.kafka.consumer.group-id}")
    public void onInventoryReserved(InventoryReservedEvent e) { orderService.handleInventoryReserved(e); }

    @KafkaListener(topics = "${app.kafka.topics.inventory-failed}", groupId = "${spring.kafka.consumer.group-id}")
    public void onInventoryFailed(InventoryFailedEvent e) { orderService.handleInventoryFailed(e); }

    @KafkaListener(topics = "${app.kafka.topics.payment-completed}", groupId = "${spring.kafka.consumer.group-id}")
    public void onPaymentCompleted(PaymentCompletedEvent e) { orderService.handlePaymentCompleted(e); }

    @KafkaListener(topics = "${app.kafka.topics.payment-failed}", groupId = "${spring.kafka.consumer.group-id}")
    public void onPaymentFailed(PaymentFailedEvent e) { orderService.handlePaymentFailed(e); }

    @KafkaListener(topics = "${app.kafka.topics.order-dispatched}", groupId = "${spring.kafka.consumer.group-id}")
    public void onOrderDispatched(OrderDispatchedEvent e) {
        log.info("Order-service received OrderDispatched for {}", e.getOrderId());
        orderService.handleOrderDispatched(e);
    }

    @KafkaListener(topics = "${app.kafka.topics.order-delivered}", groupId = "${spring.kafka.consumer.group-id}")
    public void onOrderDelivered(OrderDeliveredEvent e) {
        log.info("Order-service received OrderDelivered for {}", e.getOrderId());
        orderService.handleOrderDelivered(e);
    }
}
