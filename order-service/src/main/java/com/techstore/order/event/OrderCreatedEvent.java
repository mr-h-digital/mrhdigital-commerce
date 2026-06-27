package com.techstore.order.event;

import com.techstore.order.model.OrderItem;
import java.util.List;

public class OrderCreatedEvent {
    private String orderId;
    private String customerId;
    private String customerEmail;
    private List<OrderItem> items;
    private double totalAmount;

    public OrderCreatedEvent() {}
    public OrderCreatedEvent(String orderId, String customerId, String customerEmail,
                             List<OrderItem> items, double totalAmount) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.customerEmail = customerEmail;
        this.items = items;
        this.totalAmount = totalAmount;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
}
