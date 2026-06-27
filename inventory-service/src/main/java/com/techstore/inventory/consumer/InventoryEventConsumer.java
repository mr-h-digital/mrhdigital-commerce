package com.techstore.inventory.consumer;

import com.techstore.inventory.event.InventoryReleasedEvent;
import com.techstore.inventory.event.OrderCreatedEvent;
import com.techstore.inventory.service.InventoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class InventoryEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(InventoryEventConsumer.class);
    private final InventoryService inventoryService;

    public InventoryEventConsumer(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @KafkaListener(topics = "${app.kafka.topics.order-created}", groupId = "${spring.kafka.consumer.group-id}")
    public void onOrderCreated(OrderCreatedEvent event) {
        log.info("Inventory received OrderCreated for {}", event.getOrderId());
        inventoryService.processOrderCreated(event);
    }

    // Saga compensating transaction — restore stock on payment failure or cancellation
    @KafkaListener(topics = "${app.kafka.topics.inventory-released}", groupId = "${spring.kafka.consumer.group-id}")
    public void onInventoryReleased(InventoryReleasedEvent event) {
        log.info("Inventory received InventoryReleased for {} — restoring stock (Saga)", event.getOrderId());
        inventoryService.releaseStock(event.getOrderId(), event.getItems());
    }
}
