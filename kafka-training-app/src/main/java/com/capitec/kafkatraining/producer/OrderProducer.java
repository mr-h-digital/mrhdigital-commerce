package com.capitec.kafkatraining.producer;

import com.capitec.kafkatraining.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class OrderProducer {

    private static final Logger log = LoggerFactory.getLogger(OrderProducer.class);

    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${app.kafka.topics.orders}")
    private String ordersTopic;

    public OrderProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendOrder(Order order) {
        String message = "ORDER:%s|%s|%d|%.2f".formatted(
                order.orderId(), order.product(), order.quantity(), order.price());

        CompletableFuture<SendResult<String, String>> future =
                kafkaTemplate.send(ordersTopic, order.orderId(), message);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to send order {}: {}", order.orderId(), ex.getMessage());
            } else {
                log.info("Sent order {} to partition {} offset {}",
                        order.orderId(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}
