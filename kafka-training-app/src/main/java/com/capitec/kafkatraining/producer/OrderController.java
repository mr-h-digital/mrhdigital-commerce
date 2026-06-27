package com.capitec.kafkatraining.producer;

import com.capitec.kafkatraining.model.ConsumedMessage;
import com.capitec.kafkatraining.model.Order;
import com.capitec.kafkatraining.store.MessageStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderProducer orderProducer;
    private final MessageStore messageStore;

    public OrderController(OrderProducer orderProducer, MessageStore messageStore) {
        this.orderProducer = orderProducer;
        this.messageStore = messageStore;
    }

    @PostMapping
    public ResponseEntity<String> placeOrder(@RequestBody Order order) {
        orderProducer.sendOrder(order);
        return ResponseEntity.accepted().body("Order " + order.orderId() + " accepted");
    }

    @GetMapping("/messages")
    public ResponseEntity<List<ConsumedMessage>> getMessages() {
        return ResponseEntity.ok(messageStore.getAll());
    }

    @DeleteMapping("/messages")
    public ResponseEntity<Void> clearMessages() {
        messageStore.clear();
        return ResponseEntity.noContent().build();
    }
}
