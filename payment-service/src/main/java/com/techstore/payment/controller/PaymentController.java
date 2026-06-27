package com.techstore.payment.controller;

import com.techstore.payment.service.CircuitBreaker;
import com.techstore.payment.service.PaymentService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/circuit-breaker")
    public Map<String, Object> getCircuitBreakerState() {
        CircuitBreaker cb = paymentService.getCircuitBreaker();
        return Map.of(
            "state", cb.getState().name(),
            "consecutiveFailures", cb.getConsecutiveFailures(),
            "failureThreshold", cb.getFailureThreshold(),
            "recoveryTimeoutSeconds", cb.getRecoveryTimeoutSeconds(),
            "openedAt", cb.getOpenedAt() != null ? cb.getOpenedAt().toString() : null
        );
    }

    @PostMapping("/circuit-breaker/reset")
    public Map<String, String> resetCircuitBreaker() {
        paymentService.getCircuitBreaker().recordSuccess();
        return Map.of("message", "Circuit breaker manually reset to CLOSED");
    }
}
