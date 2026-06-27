package com.techstore.dispatch.event;

public class PaymentCompletedEvent {
    private String orderId;
    private String customerId;
    private String customerEmail;
    private double amount;
    private String transactionId;

    public PaymentCompletedEvent() {}
    public String getOrderId() { return orderId; }
    public void setOrderId(String v) { orderId = v; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String v) { customerId = v; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String v) { customerEmail = v; }
    public double getAmount() { return amount; }
    public void setAmount(double v) { amount = v; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String v) { transactionId = v; }
}
