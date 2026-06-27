package com.techstore.order.controller;

import com.techstore.order.model.Order;
import com.techstore.order.model.OrderItem;
import com.techstore.order.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) { this.orderService = orderService; }

    // ── Authenticated user endpoints ──────────────────────────────────────────

    /** Get all orders belonging to the currently authenticated user */
    @GetMapping("/me")
    public List<Order> getMyOrders(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return orderService.getOrdersByUser(userId);
    }

    /** Place an order attributed to the authenticated user */
    @PostMapping("/me")
    public ResponseEntity<Order> createMyOrder(@AuthenticationPrincipal Jwt jwt,
                                                @RequestBody CreateOrderRequest req) {
        String userId    = jwt.getSubject();
        String name      = jwt.getClaimAsString("name");
        String email     = jwt.getClaimAsString("email");
        return ResponseEntity.accepted().body(orderService.createOrder(
                userId,
                name  != null ? name  : req.customerName(),
                email != null ? email : req.customerEmail(),
                req.items(), req.street(), req.suburb(),
                req.city(), req.postalCode(), req.province()));
    }

    @PostMapping("/me/{orderId}/cancel")
    public ResponseEntity<Order> cancelMyOrder(@AuthenticationPrincipal Jwt jwt,
                                                @PathVariable String orderId,
                                                @RequestBody(required = false) ReasonRequest req) {
        String userId = jwt.getSubject();
        return orderService.cancelOrderForUser(orderId, userId,
                req != null && req.reason() != null ? req.reason() : "Cancelled by customer")
                .map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/me/{orderId}/return")
    public ResponseEntity<Order> returnMyOrder(@AuthenticationPrincipal Jwt jwt,
                                                @PathVariable String orderId,
                                                @RequestBody(required = false) ReasonRequest req) {
        String userId = jwt.getSubject();
        return orderService.requestReturnForUser(orderId, userId,
                req != null && req.reason() != null ? req.reason() : "Customer return request")
                .map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // ── Legacy / unauthenticated endpoints (kept for internal use & training app) ──

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody CreateOrderRequest req) {
        return ResponseEntity.accepted().body(orderService.createOrder(
                req.customerId(), req.customerName(), req.customerEmail(), req.items(),
                req.street(), req.suburb(), req.city(), req.postalCode(), req.province()));
    }

    @GetMapping
    public List<Order> getAllOrders() { return orderService.getAllOrders(); }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrder(@PathVariable String orderId) {
        return orderService.getOrder(orderId).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable String orderId,
                                              @RequestBody(required = false) ReasonRequest req) {
        return orderService.cancelOrder(orderId,
                req != null && req.reason() != null ? req.reason() : "Cancelled by customer")
                .map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{orderId}/return")
    public ResponseEntity<Order> returnOrder(@PathVariable String orderId,
                                              @RequestBody(required = false) ReasonRequest req) {
        return orderService.requestReturn(orderId,
                req != null && req.reason() != null ? req.reason() : "Customer return request")
                .map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    public record CreateOrderRequest(
        String customerId, String customerName, String customerEmail, List<OrderItem> items,
        String street, String suburb, String city, String postalCode, String province
    ) {}

    public record ReasonRequest(String reason) {}
}
