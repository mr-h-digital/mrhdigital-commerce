package com.techstore.order.event;

public class OrderDispatchedEvent {
    private String orderId;
    private String customerId;
    private String customerEmail;
    private String courier;
    private String trackingNumber;
    private String estimatedDelivery;

    public OrderDispatchedEvent() {}
    public String getOrderId() { return orderId; }
    public void setOrderId(String v) { orderId = v; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String v) { customerId = v; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String v) { customerEmail = v; }
    public String getCourier() { return courier; }
    public void setCourier(String v) { courier = v; }
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String v) { trackingNumber = v; }
    public String getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(String v) { estimatedDelivery = v; }
}
