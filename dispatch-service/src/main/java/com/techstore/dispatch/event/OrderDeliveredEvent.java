package com.techstore.dispatch.event;

public class OrderDeliveredEvent {
    private String orderId;
    private String customerId;
    private String customerEmail;
    private String trackingNumber;

    public OrderDeliveredEvent() {}
    public OrderDeliveredEvent(String orderId, String customerId, String customerEmail, String trackingNumber) {
        this.orderId = orderId; this.customerId = customerId;
        this.customerEmail = customerEmail; this.trackingNumber = trackingNumber;
    }
    public String getOrderId() { return orderId; }
    public void setOrderId(String v) { orderId = v; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String v) { customerId = v; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String v) { customerEmail = v; }
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String v) { trackingNumber = v; }
}
