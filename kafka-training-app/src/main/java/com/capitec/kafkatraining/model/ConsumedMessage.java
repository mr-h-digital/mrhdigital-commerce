package com.capitec.kafkatraining.model;

public record ConsumedMessage(
    String key,
    String value,
    int partition,
    long offset,
    long timestamp
) {}
