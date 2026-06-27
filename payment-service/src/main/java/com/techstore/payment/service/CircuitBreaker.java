package com.techstore.payment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class CircuitBreaker {

    private static final Logger log = LoggerFactory.getLogger(CircuitBreaker.class);

    public enum State { CLOSED, OPEN, HALF_OPEN }

    @Value("${app.circuit-breaker.failure-threshold:3}")
    private int failureThreshold;

    @Value("${app.circuit-breaker.recovery-timeout-seconds:30}")
    private long recoveryTimeoutSeconds;

    private volatile State state = State.CLOSED;
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private volatile Instant openedAt;

    public boolean isOpen() {
        if (state == State.OPEN) {
            // Check if recovery timeout has elapsed — move to HALF_OPEN
            if (Instant.now().isAfter(openedAt.plusSeconds(recoveryTimeoutSeconds))) {
                state = State.HALF_OPEN;
                log.info("Circuit breaker → HALF_OPEN (attempting recovery)");
                return false;
            }
            return true;
        }
        return false;
    }

    public void recordSuccess() {
        consecutiveFailures.set(0);
        if (state != State.CLOSED) {
            state = State.CLOSED;
            log.info("Circuit breaker → CLOSED (gateway recovered)");
        }
    }

    public void recordFailure() {
        int failures = consecutiveFailures.incrementAndGet();
        if (failures >= failureThreshold && state == State.CLOSED) {
            state = State.OPEN;
            openedAt = Instant.now();
            log.warn("Circuit breaker → OPEN after {} consecutive failures. Will retry in {}s",
                    failures, recoveryTimeoutSeconds);
        }
    }

    public State getState() { return state; }
    public int getConsecutiveFailures() { return consecutiveFailures.get(); }
    public Instant getOpenedAt() { return openedAt; }
    public int getFailureThreshold() { return failureThreshold; }
    public long getRecoveryTimeoutSeconds() { return recoveryTimeoutSeconds; }
}
