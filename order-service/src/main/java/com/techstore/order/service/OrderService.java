package com.techstore.order.service;

import com.techstore.order.event.*;
import com.techstore.order.model.*;
import com.techstore.order.producer.OrderEventProducer;
import com.techstore.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private final OrderRepository orderRepository;
    private final OrderEventProducer producer;

    @Value("${app.order.timeout-seconds:60}")
    private long timeoutSeconds;

    public OrderService(OrderRepository orderRepository, OrderEventProducer producer) {
        this.orderRepository = orderRepository;
        this.producer = producer;
    }

    @Transactional
    public Order createOrder(String customerId, String customerName, String customerEmail,
                             List<OrderItem> items, String street, String suburb,
                             String city, String postalCode, String province) {
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        double subtotal = items.stream().mapToDouble(i -> i.getUnitPrice() * i.getQuantity()).sum();
        Order order = new Order(orderId, customerId, customerName, customerEmail,
                items, subtotal, street, suburb, city, postalCode, province);
        orderRepository.save(order);
        producer.publishOrderCreated(new OrderCreatedEvent(orderId, customerId, customerEmail, items, order.getTotalAmount()));
        return order;
    }

    @Transactional
    public Optional<Order> cancelOrder(String orderId, String reason) {
        return orderRepository.findById(orderId).map(order -> {
            if (order.getStatus() == OrderStatus.CONFIRMED || order.getStatus() == OrderStatus.CANCELLED
                    || order.getStatus() == OrderStatus.DISPATCHED || order.getStatus() == OrderStatus.DELIVERED) {
                return order;
            }
            boolean wasReserved = order.getStatus() == OrderStatus.INVENTORY_RESERVED;
            order.setStatus(OrderStatus.CANCELLED);
            order.setStatusMessage("Cancelled: " + reason);
            orderRepository.save(order);
            producer.publishOrderCancelled(new OrderCancelledEvent(orderId, order.getCustomerId(), order.getCustomerEmail(), order.getItems(), reason));
            if (wasReserved) producer.publishInventoryReleased(new InventoryReleasedEvent(orderId, order.getItems()));
            producer.publishOrderStatusUpdated(new OrderStatusUpdatedEvent(orderId, "CANCELLED", "Cancelled: " + reason));
            return order;
        });
    }

    @Transactional
    public Optional<Order> requestReturn(String orderId, String reason) {
        return orderRepository.findById(orderId).map(order -> {
            if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.CONFIRMED) {
                log.warn("Return not allowed for order {} in status {}", orderId, order.getStatus());
                return order;
            }
            order.setStatus(OrderStatus.RETURN_REQUESTED);
            order.setReturnReason(reason);
            order.setStatusMessage("Return requested: " + reason);
            orderRepository.save(order);

            producer.publishOrderReturnRequested(new OrderReturnRequestedEvent(
                    orderId, order.getCustomerId(), order.getCustomerEmail(),
                    order.getItems(), reason, order.getTotalAmount()));
            producer.publishOrderStatusUpdated(new OrderStatusUpdatedEvent(orderId, "RETURN_REQUESTED", "Return requested: " + reason));

            // Auto-process return: release stock + issue refund after short delay
            new Thread(() -> {
                try { Thread.sleep(3000); } catch (InterruptedException ignored) {}
                processReturn(orderId);
            }).start();
            return order;
        });
    }

    @Transactional
    public void processReturn(String orderId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            order.setStatus(OrderStatus.RETURNED);
            order.setStatusMessage("Return processed — refund issued");
            orderRepository.save(order);

            producer.publishInventoryReleased(new InventoryReleasedEvent(orderId, order.getItems()));

            String refRef = "REF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            producer.publishRefundIssued(new RefundIssuedEvent(
                    orderId, order.getCustomerId(), order.getCustomerEmail(),
                    order.getTotalAmount(), refRef));

            producer.publishOrderStatusUpdated(new OrderStatusUpdatedEvent(orderId, "RETURNED", "Refund R" + order.getTotalAmount() + " issued — ref " + refRef));
            log.info("Return processed for order {} — refund {}", orderId, refRef);
        });
    }

    @Transactional
    public void handleInventoryReserved(InventoryReservedEvent event) {
        updateOrder(event.getOrderId(), OrderStatus.INVENTORY_RESERVED, "Stock reserved — processing payment");
        producer.publishOrderStatusUpdated(new OrderStatusUpdatedEvent(event.getOrderId(), "INVENTORY_RESERVED", "Stock reserved — processing payment"));
    }

    @Transactional
    public void handleInventoryFailed(InventoryFailedEvent event) {
        updateOrder(event.getOrderId(), OrderStatus.FAILED, "Out of stock: " + event.getReason());
        producer.publishOrderStatusUpdated(new OrderStatusUpdatedEvent(event.getOrderId(), "FAILED", "Out of stock: " + event.getReason()));
    }

    @Transactional
    public void handlePaymentCompleted(PaymentCompletedEvent event) {
        updateOrder(event.getOrderId(), OrderStatus.CONFIRMED, "Payment confirmed — order dispatching soon");
        producer.publishOrderStatusUpdated(new OrderStatusUpdatedEvent(event.getOrderId(), "CONFIRMED", "Payment confirmed — order dispatching soon"));
    }

    @Transactional
    public void handlePaymentFailed(PaymentFailedEvent event) {
        orderRepository.findById(event.getOrderId()).ifPresent(order -> {
            order.setStatus(OrderStatus.FAILED);
            order.setStatusMessage("Payment declined: " + event.getReason());
            orderRepository.save(order);
            producer.publishInventoryReleased(new InventoryReleasedEvent(event.getOrderId(), order.getItems()));
            producer.publishOrderStatusUpdated(new OrderStatusUpdatedEvent(event.getOrderId(), "FAILED", "Payment declined: " + event.getReason()));
        });
    }

    @Transactional
    public void handleOrderDispatched(OrderDispatchedEvent event) {
        orderRepository.findById(event.getOrderId()).ifPresent(order -> {
            order.setStatus(OrderStatus.DISPATCHED);
            order.setTrackingNumber(event.getTrackingNumber());
            order.setCourier(event.getCourier());
            order.setDispatchedAt(Instant.now());
            order.setStatusMessage("Dispatched via " + event.getCourier() + " — tracking " + event.getTrackingNumber());
            orderRepository.save(order);
            producer.publishOrderStatusUpdated(new OrderStatusUpdatedEvent(event.getOrderId(), "DISPATCHED",
                    "Dispatched via " + event.getCourier() + " · tracking " + event.getTrackingNumber()));
        });
    }

    @Transactional
    public void handleOrderDelivered(OrderDeliveredEvent event) {
        orderRepository.findById(event.getOrderId()).ifPresent(order -> {
            order.setStatus(OrderStatus.DELIVERED);
            order.setDeliveredAt(Instant.now());
            order.setStatusMessage("Delivered successfully — enjoy your purchase!");
            orderRepository.save(order);
            producer.publishOrderStatusUpdated(new OrderStatusUpdatedEvent(event.getOrderId(), "DELIVERED", "Order delivered successfully!"));
        });
    }

    @Scheduled(fixedDelay = 15000)
    @Transactional
    public void expireStaleOrders() {
        Instant cutoff = Instant.now().minusSeconds(timeoutSeconds);
        orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.PENDING && o.getCreatedAt().isBefore(cutoff))
                .forEach(o -> cancelOrder(o.getOrderId(), "Order timed out — no response from pipeline"));
    }

    private void updateOrder(String orderId, OrderStatus status, String message) {
        orderRepository.findById(orderId).ifPresentOrElse(order -> {
            order.setStatus(status);
            order.setStatusMessage(message);
            orderRepository.save(order);
        }, () -> log.warn("Order {} not found", orderId));
    }

    public List<Order> getAllOrders() { return orderRepository.findAll(); }
    public Optional<Order> getOrder(String orderId) { return orderRepository.findById(orderId); }

    // ── User-scoped methods ───────────────────────────────────────────────────

    public List<Order> getOrdersByUser(String userId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Optional<Order> cancelOrderForUser(String orderId, String userId, String reason) {
        if (orderRepository.findByOrderIdAndCustomerId(orderId, userId).isEmpty()) {
            return Optional.empty(); // not this user's order
        }
        return cancelOrder(orderId, reason);
    }

    @Transactional
    public Optional<Order> requestReturnForUser(String orderId, String userId, String reason) {
        if (orderRepository.findByOrderIdAndCustomerId(orderId, userId).isEmpty()) {
            return Optional.empty();
        }
        return requestReturn(orderId, reason);
    }
}
