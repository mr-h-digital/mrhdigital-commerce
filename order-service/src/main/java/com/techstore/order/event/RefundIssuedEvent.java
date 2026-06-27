package com.techstore.order.event;

public class RefundIssuedEvent {
    private String orderId;
    private String customerId;
    private String customerEmail;
    private double refundAmount;
    private String refundReference;

    public RefundIssuedEvent() {}
    public RefundIssuedEvent(String orderId, String customerId, String customerEmail,
                              double refundAmount, String refundReference) {
        this.orderId = orderId; this.customerId = customerId; this.customerEmail = customerEmail;
        this.refundAmount = refundAmount; this.refundReference = refundReference;
    }
    public String getOrderId() { return orderId; }
    public void setOrderId(String v) { orderId = v; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String v) { customerId = v; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String v) { customerEmail = v; }
    public double getRefundAmount() { return refundAmount; }
    public void setRefundAmount(double v) { refundAmount = v; }
    public String getRefundReference() { return refundReference; }
    public void setRefundReference(String v) { refundReference = v; }
}
