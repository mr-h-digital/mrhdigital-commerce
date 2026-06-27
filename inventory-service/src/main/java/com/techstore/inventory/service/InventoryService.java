package com.techstore.inventory.service;

import com.techstore.inventory.event.*;
import com.techstore.inventory.model.StockItem;
import com.techstore.inventory.repository.StockRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final StockRepository stockRepository;

    @Value("${app.kafka.topics.inventory-reserved}") private String reservedTopic;
    @Value("${app.kafka.topics.inventory-failed}")   private String failedTopic;

    public InventoryService(KafkaTemplate<String, Object> kafkaTemplate,
                            StockRepository stockRepository) {
        this.kafkaTemplate = kafkaTemplate;
        this.stockRepository = stockRepository;
    }

    @Transactional
    public void processOrderCreated(OrderCreatedEvent event) {
        log.info("Inventory checking stock for order {}", event.getOrderId());

        for (OrderCreatedEvent.OrderItem item : event.getItems()) {
            StockItem stock = stockRepository.findById(item.getProductId()).orElse(null);
            int available = stock != null ? stock.getQuantity() : 0;
            if (available < item.getQuantity()) {
                String reason = item.getProductName() + " — only " + available + " in stock";
                log.warn("Insufficient stock for order {}: {}", event.getOrderId(), reason);
                kafkaTemplate.send(failedTopic, event.getOrderId(),
                        new InventoryFailedEvent(event.getOrderId(), reason));
                return;
            }
        }

        for (OrderCreatedEvent.OrderItem item : event.getItems()) {
            int updated = stockRepository.decrementStock(item.getProductId(), item.getQuantity());
            if (updated == 0) {
                String reason = item.getProductName() + " — stock depleted during reservation";
                log.warn("Race condition for order {}: {}", event.getOrderId(), reason);
                kafkaTemplate.send(failedTopic, event.getOrderId(),
                        new InventoryFailedEvent(event.getOrderId(), reason));
                return;
            }
        }

        log.info("Stock reserved for order {}", event.getOrderId());
        kafkaTemplate.send(reservedTopic, event.getOrderId(),
                new InventoryReservedEvent(event.getOrderId(),
                        event.getCustomerId(), event.getCustomerEmail(), event.getTotalAmount()));
    }

    // Saga compensating transaction — release stock back when payment fails or order is cancelled
    @Transactional
    public void releaseStock(String orderId, java.util.List<InventoryReleasedEvent.OrderItem> items) {
        log.info("Releasing stock for order {} (Saga compensation)", orderId);
        for (InventoryReleasedEvent.OrderItem item : items) {
            stockRepository.findById(item.getProductId()).ifPresent(stock -> {
                stock.setQuantity(stock.getQuantity() + item.getQuantity());
                stockRepository.save(stock);
                log.info("Released {} x {} back to stock (now {})",
                        item.getQuantity(), item.getProductId(), stock.getQuantity());
            });
        }
    }

    public Map<String, Integer> getStock() {
        return stockRepository.findAll().stream()
                .collect(Collectors.toMap(StockItem::getProductId, StockItem::getQuantity));
    }
}
