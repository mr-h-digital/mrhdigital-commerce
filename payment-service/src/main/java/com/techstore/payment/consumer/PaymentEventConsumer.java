package com.techstore.payment.consumer;

import com.techstore.payment.event.InventoryReservedEvent;
import com.techstore.payment.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class PaymentEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(PaymentEventConsumer.class);
    private final PaymentService paymentService;

    public PaymentEventConsumer(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @KafkaListener(topics = "${app.kafka.topics.inventory-reserved}", groupId = "${spring.kafka.consumer.group-id}")
    public void onInventoryReserved(InventoryReservedEvent event) {
        log.info("Payment-service received InventoryReserved for {}", event.getOrderId());
        paymentService.processPayment(event);
    }
}
