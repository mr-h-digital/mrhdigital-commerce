package com.techstore.order.event;

public class OrderDeliveredEvent {
    private String orderId;
    private String customerId;
    private String customerEmail;
    private String trackingNumber;

    public OrderDeliveredEvent() {}
    public String getOrderId() { return orderId; }
    public void setOrderId(String v) { orderId = v; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String v) { customerId = v; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String v) { customerEmail = v; }
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String v) { trackingNumber = v; }
}
