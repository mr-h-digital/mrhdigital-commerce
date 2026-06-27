package com.techstore.order.model;

public enum OrderStatus {
    PENDING,
    INVENTORY_RESERVED,
    CONFIRMED,
    DISPATCHED,
    DELIVERED,
    RETURN_REQUESTED,
    RETURNED,
    FAILED,
    CANCELLED
}
