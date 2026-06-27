package com.techstore.payment.event;

public class PaymentCompletedEvent {
    private String orderId;
    private String customerId;
    private String customerEmail;
    private double amount;
    private String transactionId;

    public PaymentCompletedEvent() {}
    public PaymentCompletedEvent(String orderId, String customerId, String customerEmail, double amount, String transactionId) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.customerEmail = customerEmail;
        this.amount = amount;
        this.transactionId = transactionId;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
}
