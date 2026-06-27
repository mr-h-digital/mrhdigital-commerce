package com.techstore.payment.service;

import com.techstore.payment.event.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final CircuitBreaker circuitBreaker;

    @Value("${app.kafka.topics.payment-completed}") private String completedTopic;
    @Value("${app.kafka.topics.payment-failed}")    private String failedTopic;

    public PaymentService(KafkaTemplate<String, Object> kafkaTemplate, CircuitBreaker circuitBreaker) {
        this.kafkaTemplate = kafkaTemplate;
        this.circuitBreaker = circuitBreaker;
    }

    public void processPayment(InventoryReservedEvent event) {
        log.info("Processing payment for order {} — R{}", event.getOrderId(), event.getTotalAmount());

        // Circuit breaker: fail-fast if gateway is unavailable
        if (circuitBreaker.isOpen()) {
            log.warn("Circuit OPEN — rejecting payment for order {} (fast-fail)", event.getOrderId());
            circuitBreaker.recordFailure();
            kafkaTemplate.send(failedTopic, event.getOrderId(),
                    new PaymentFailedEvent(event.getOrderId(),
                            "Payment gateway unavailable (circuit open) — please try again later"));
            return;
        }

        // Simulate 85% success, 15% failure (drives circuit breaker scenarios)
        boolean success = Math.random() > 0.15;

        if (success) {
            String txId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            log.info("Payment approved for order {} — txn {}", event.getOrderId(), txId);
            circuitBreaker.recordSuccess();
            kafkaTemplate.send(completedTopic, event.getOrderId(),
                    new PaymentCompletedEvent(event.getOrderId(), event.getCustomerId(),
                            event.getCustomerEmail(), event.getTotalAmount(), txId));
        } else {
            log.warn("Payment declined for order {}", event.getOrderId());
            circuitBreaker.recordFailure();
            String reason = circuitBreaker.getState() == CircuitBreaker.State.OPEN
                    ? "Payment gateway tripped circuit breaker after repeated failures"
                    : "Card declined by issuing bank";
            kafkaTemplate.send(failedTopic, event.getOrderId(),
                    new PaymentFailedEvent(event.getOrderId(), reason));
        }
    }

    public CircuitBreaker getCircuitBreaker() { return circuitBreaker; }
}
