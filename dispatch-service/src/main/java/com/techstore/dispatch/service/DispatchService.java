package com.techstore.dispatch.service;

import com.techstore.dispatch.event.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DispatchService {

    private static final Logger log = LoggerFactory.getLogger(DispatchService.class);
    private static final String[] COURIERS = {"The Courier Guy", "Aramex", "Dawn Wing", "PostNet", "RAM Couriers"};

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.order-dispatched}") private String dispatchedTopic;
    @Value("${app.kafka.topics.order-delivered}")  private String deliveredTopic;

    // Track dispatched orders pending delivery simulation
    private final Map<String, OrderDispatchedEvent> pendingDelivery = new ConcurrentHashMap<>();

    public DispatchService(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void dispatch(PaymentCompletedEvent payment) {
        String courier  = COURIERS[new Random().nextInt(COURIERS.length)];
        String tracking = courier.substring(0, 2).toUpperCase() + "-"
                        + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String eta = "3–5 business days";

        log.info("Dispatching order {} via {} — tracking {}", payment.getOrderId(), courier, tracking);

        OrderDispatchedEvent event = new OrderDispatchedEvent(
                payment.getOrderId(), payment.getCustomerId(), payment.getCustomerEmail(),
                courier, tracking, eta);

        kafkaTemplate.send(dispatchedTopic, payment.getOrderId(), event);
        pendingDelivery.put(payment.getOrderId(), event);
    }

    // Simulate delivery after a random 20-40s delay
    @Scheduled(fixedDelay = 5000)
    public void simulateDeliveries() {
        long now = System.currentTimeMillis();
        pendingDelivery.forEach((orderId, dispatched) -> {
            // Each order delivers after ~30s
            pendingDelivery.remove(orderId);
            new Thread(() -> {
                try { Thread.sleep(20000 + new Random().nextInt(20000)); } catch (InterruptedException ignored) {}
                log.info("Order {} delivered via {}", orderId, dispatched.getCourier());
                kafkaTemplate.send(deliveredTopic, orderId,
                        new OrderDeliveredEvent(orderId, dispatched.getCustomerId(),
                                dispatched.getCustomerEmail(), dispatched.getTrackingNumber()));
            }).start();
        });
    }

    public Map<String, OrderDispatchedEvent> getPendingDeliveries() {
        return Collections.unmodifiableMap(pendingDelivery);
    }
}
