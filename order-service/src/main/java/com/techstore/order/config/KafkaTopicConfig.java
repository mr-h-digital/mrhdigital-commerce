package com.techstore.order.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Value("${app.kafka.topics.order-created}")          private String orderCreated;
    @Value("${app.kafka.topics.order-cancelled}")        private String orderCancelled;
    @Value("${app.kafka.topics.order-dispatched}")       private String orderDispatched;
    @Value("${app.kafka.topics.order-delivered}")        private String orderDelivered;
    @Value("${app.kafka.topics.order-return-requested}") private String orderReturnRequested;
    @Value("${app.kafka.topics.refund-issued}")          private String refundIssued;
    @Value("${app.kafka.topics.inventory-reserved}")     private String inventoryReserved;
    @Value("${app.kafka.topics.inventory-released}")     private String inventoryReleased;
    @Value("${app.kafka.topics.inventory-failed}")       private String inventoryFailed;
    @Value("${app.kafka.topics.payment-completed}")      private String paymentCompleted;
    @Value("${app.kafka.topics.payment-failed}")         private String paymentFailed;
    @Value("${app.kafka.topics.order-status-updated}")   private String orderStatusUpdated;

    @Bean public NewTopic t01() { return t(orderCreated); }
    @Bean public NewTopic t02() { return t(orderCancelled); }
    @Bean public NewTopic t03() { return t(orderDispatched); }
    @Bean public NewTopic t04() { return t(orderDelivered); }
    @Bean public NewTopic t05() { return t(orderReturnRequested); }
    @Bean public NewTopic t06() { return t(refundIssued); }
    @Bean public NewTopic t07() { return t(inventoryReserved); }
    @Bean public NewTopic t08() { return t(inventoryReleased); }
    @Bean public NewTopic t09() { return t(inventoryFailed); }
    @Bean public NewTopic t10() { return t(paymentCompleted); }
    @Bean public NewTopic t11() { return t(paymentFailed); }
    @Bean public NewTopic t12() { return t(orderStatusUpdated); }

    private NewTopic t(String name) { return TopicBuilder.name(name).partitions(3).replicas(1).build(); }
}
