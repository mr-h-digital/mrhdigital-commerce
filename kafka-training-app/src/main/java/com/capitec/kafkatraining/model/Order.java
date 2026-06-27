package com.capitec.kafkatraining.model;

public record Order(String orderId, String product, int quantity, double price) {
}
