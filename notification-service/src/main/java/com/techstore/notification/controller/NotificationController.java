package com.techstore.notification.controller;

import com.techstore.notification.model.OrderEmail;
import com.techstore.notification.model.StoreEvent;
import com.techstore.notification.store.EmailStore;
import com.techstore.notification.store.EventStore;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class NotificationController {

    private final EventStore eventStore;
    private final EmailStore emailStore;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public NotificationController(EventStore eventStore, EmailStore emailStore,
                                   KafkaTemplate<String, Object> kafkaTemplate) {
        this.eventStore = eventStore;
        this.emailStore = emailStore;
        this.kafkaTemplate = kafkaTemplate;
    }

    @GetMapping("/events")
    public List<StoreEvent> getEvents(@RequestParam(defaultValue = "0") int offset) {
        List<StoreEvent> all = eventStore.getAll();
        return offset > 0 ? all.subList(Math.min(offset, all.size()), all.size()) : all;
    }

    @DeleteMapping("/events")
    public ResponseEntity<Void> clearEvents() { eventStore.clear(); return ResponseEntity.noContent().build(); }

    @GetMapping("/events/order/{orderId}")
    public List<StoreEvent> getOrderEvents(@PathVariable String orderId) {
        return eventStore.getAll().stream()
                .filter(e -> orderId.equals(e.getOrderId()))
                .sorted(Comparator.comparing(StoreEvent::getTimestamp))
                .toList();
    }

    @PostMapping("/events/replay")
    public Map<String, Object> replayEvents(@RequestParam(defaultValue = "10") int count) {
        List<StoreEvent> events = eventStore.getAll();
        int toReplay = Math.min(count, events.size());
        List<StoreEvent> subset = events.subList(events.size() - toReplay, events.size());
        int replayed = 0;
        for (StoreEvent ev : subset) {
            if (ev.getOrderId() != null && !ev.getOrderId().isBlank() && !"?".equals(ev.getOrderId())) {
                kafkaTemplate.send(ev.getTopic() + ".replay", ev.getOrderId(), ev);
                replayed++;
            }
        }
        return Map.of("replayed", replayed, "total", events.size(),
                "message", "Replayed " + replayed + " events to *.replay topics");
    }

    @GetMapping("/emails/{orderId}")
    public ResponseEntity<OrderEmail> getEmail(@PathVariable String orderId) {
        return emailStore.get(orderId).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/emails")
    public List<OrderEmail> getAllEmails() { return new java.util.ArrayList<>(emailStore.getAll()); }

    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics() {
        List<StoreEvent> events = eventStore.getAll();
        long totalOrders   = events.stream().filter(e -> "OrderCreated".equals(e.getEventType())).count();
        long confirmed     = events.stream().filter(e -> "OrderStatusUpdated".equals(e.getEventType()) && e.getSummary().contains("CONFIRMED")).count();
        long dispatched    = events.stream().filter(e -> "OrderDispatched".equals(e.getEventType())).count();
        long delivered     = events.stream().filter(e -> "OrderDelivered".equals(e.getEventType())).count();
        long returned      = events.stream().filter(e -> "RefundIssued".equals(e.getEventType())).count();
        long failed        = events.stream().filter(e -> "OrderStatusUpdated".equals(e.getEventType()) && e.getSummary().contains("FAILED")).count();
        long cancelled     = events.stream().filter(e -> "OrderCancelled".equals(e.getEventType())).count();
        long stockReleases = events.stream().filter(e -> "InventoryReleased".equals(e.getEventType())).count();
        long dlqMessages   = events.stream().filter(e -> "DeadLetter".equals(e.getEventType())).count();
        double successRate = totalOrders > 0 ? Math.round((double) confirmed / totalOrders * 1000.0) / 10.0 : 0;
        return Map.ofEntries(
            Map.entry("totalOrders",   totalOrders),
            Map.entry("confirmed",     confirmed),
            Map.entry("dispatched",    dispatched),
            Map.entry("delivered",     delivered),
            Map.entry("returned",      returned),
            Map.entry("failed",        failed),
            Map.entry("cancelled",     cancelled),
            Map.entry("stockReleases", stockReleases),
            Map.entry("dlqMessages",   dlqMessages),
            Map.entry("successRate",   successRate),
            Map.entry("totalEvents",   (long) events.size())
        );
    }

    @GetMapping("/circuit-breaker")
    public Map<String, Object> getCircuitBreakerStatus() {
        try {
            var res = new org.springframework.web.client.RestTemplate()
                    .getForObject("http://localhost:8085/api/payment/circuit-breaker", Map.class);
            return res != null ? res : Map.of("state", "UNKNOWN");
        } catch (Exception e) {
            return Map.of("state", "UNREACHABLE", "error", e.getMessage());
        }
    }
}
