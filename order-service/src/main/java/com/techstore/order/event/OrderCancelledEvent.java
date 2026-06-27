package com.techstore.order.event;

import com.techstore.order.model.OrderItem;
import java.util.List;

public class OrderCancelledEvent {
    private String orderId;
    private String customerId;
    private String customerEmail;
    private List<OrderItem> items;
    private String reason;

    public OrderCancelledEvent() {}
    public OrderCancelledEvent(String orderId, String customerId, String customerEmail,
                                List<OrderItem> items, String reason) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.customerEmail = customerEmail;
        this.items = items;
        this.reason = reason;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String v) { this.orderId = v; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String v) { this.customerId = v; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String v) { this.customerEmail = v; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> v) { this.items = v; }
    public String getReason() { return reason; }
    public void setReason(String v) { this.reason = v; }
}
