package com.techstore.order.event;

import com.techstore.order.model.OrderItem;
import java.util.List;

public class OrderReturnRequestedEvent {
    private String orderId;
    private String customerId;
    private String customerEmail;
    private List<OrderItem> items;
    private String reason;
    private double refundAmount;

    public OrderReturnRequestedEvent() {}
    public OrderReturnRequestedEvent(String orderId, String customerId, String customerEmail,
                                      List<OrderItem> items, String reason, double refundAmount) {
        this.orderId = orderId; this.customerId = customerId; this.customerEmail = customerEmail;
        this.items = items; this.reason = reason; this.refundAmount = refundAmount;
    }
    public String getOrderId() { return orderId; }
    public void setOrderId(String v) { orderId = v; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String v) { customerId = v; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String v) { customerEmail = v; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> v) { items = v; }
    public String getReason() { return reason; }
    public void setReason(String v) { reason = v; }
    public double getRefundAmount() { return refundAmount; }
    public void setRefundAmount(double v) { refundAmount = v; }
}
