package com.techstore.notification.model;

import java.time.Instant;

public class StoreEvent {
    private String id;
    private String topic;
    private String eventType;
    private String orderId;
    private String summary;
    private String detail;
    private String status; // SUCCESS, FAILURE, INFO
    private Instant timestamp;

    public StoreEvent() {}
    public StoreEvent(String id, String topic, String eventType, String orderId,
                      String summary, String detail, String status) {
        this.id = id;
        this.topic = topic;
        this.eventType = eventType;
        this.orderId = orderId;
        this.summary = summary;
        this.detail = detail;
        this.status = status;
        this.timestamp = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
