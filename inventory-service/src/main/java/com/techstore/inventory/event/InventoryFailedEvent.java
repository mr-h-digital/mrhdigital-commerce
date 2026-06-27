package com.techstore.inventory.event;

public class InventoryFailedEvent {
    private String orderId;
    private String reason;

    public InventoryFailedEvent() {}
    public InventoryFailedEvent(String orderId, String reason) {
        this.orderId = orderId;
        this.reason = reason;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
