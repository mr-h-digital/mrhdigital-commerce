package com.techstore.order.event;

public class InventoryReservedEvent {
    private String orderId;
    private String customerId;
    private String customerEmail;
    private double totalAmount;

    public InventoryReservedEvent() {}
    public InventoryReservedEvent(String orderId, String customerId, String customerEmail, double totalAmount) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.customerEmail = customerEmail;
        this.totalAmount = totalAmount;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
}
