package com.techstore.order.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id private String orderId;
    private String customerId;
    private String customerEmail;
    private String customerName;
    private double totalAmount;
    private double vatAmount;
    private double subtotalAmount;
    private String street;
    private String suburb;
    private String city;
    private String postalCode;
    private String province;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private Instant createdAt;
    private String statusMessage;
    private String estimatedDelivery;
    private String trackingNumber;
    private String courier;
    private Instant dispatchedAt;
    private Instant deliveredAt;
    private String returnReason;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JoinColumn(name = "order_id")
    private List<OrderItem> items;

    public Order() {}

    public Order(String orderId, String customerId, String customerName, String customerEmail,
                 List<OrderItem> items, double subtotal,
                 String street, String suburb, String city, String postalCode, String province) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.items = items;
        this.subtotalAmount = subtotal;
        this.vatAmount = Math.round(subtotal * 0.15 * 100.0) / 100.0;
        this.totalAmount = Math.round((subtotal + this.vatAmount) * 100.0) / 100.0;
        this.street = street; this.suburb = suburb; this.city = city;
        this.postalCode = postalCode; this.province = province;
        this.status = OrderStatus.PENDING;
        this.createdAt = Instant.now();
        this.statusMessage = "Order received";
        this.estimatedDelivery = "3–5 business days";
    }

    // Getters/setters
    public String getOrderId() { return orderId; }
    public void setOrderId(String v) { orderId = v; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String v) { customerId = v; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String v) { customerName = v; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String v) { customerEmail = v; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> v) { items = v; }
    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double v) { totalAmount = v; }
    public double getVatAmount() { return vatAmount; }
    public void setVatAmount(double v) { vatAmount = v; }
    public double getSubtotalAmount() { return subtotalAmount; }
    public void setSubtotalAmount(double v) { subtotalAmount = v; }
    public String getStreet() { return street; }
    public void setStreet(String v) { street = v; }
    public String getSuburb() { return suburb; }
    public void setSuburb(String v) { suburb = v; }
    public String getCity() { return city; }
    public void setCity(String v) { city = v; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String v) { postalCode = v; }
    public String getProvince() { return province; }
    public void setProvince(String v) { province = v; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus v) { status = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { createdAt = v; }
    public String getStatusMessage() { return statusMessage; }
    public void setStatusMessage(String v) { statusMessage = v; }
    public String getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(String v) { estimatedDelivery = v; }
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String v) { trackingNumber = v; }
    public String getCourier() { return courier; }
    public void setCourier(String v) { courier = v; }
    public Instant getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(Instant v) { dispatchedAt = v; }
    public Instant getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(Instant v) { deliveredAt = v; }
    public String getReturnReason() { return returnReason; }
    public void setReturnReason(String v) { returnReason = v; }
}
