package com.techstore.order.event;

import com.techstore.order.model.OrderItem;
import java.util.List;

public class InventoryReleasedEvent {
    private String orderId;
    private List<OrderItem> items;

    public InventoryReleasedEvent() {}
    public InventoryReleasedEvent(String orderId, List<OrderItem> items) {
        this.orderId = orderId;
        this.items = items;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String v) { this.orderId = v; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> v) { this.items = v; }
}
