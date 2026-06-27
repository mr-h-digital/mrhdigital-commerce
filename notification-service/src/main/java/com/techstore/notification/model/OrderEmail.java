package com.techstore.notification.model;

import java.time.Instant;
import java.util.List;

public class OrderEmail {
    private String orderId;
    private String customerName;
    private String customerEmail;
    private String status;
    private double subtotal;
    private double vat;
    private double total;
    private String street;
    private String suburb;
    private String city;
    private String postalCode;
    private String province;
    private String estimatedDelivery;
    private List<LineItem> items;
    private Instant generatedAt;

    public OrderEmail() { this.generatedAt = Instant.now(); }

    public record LineItem(String name, int qty, double unitPrice, double lineTotal) {}

    public String getOrderId() { return orderId; }
    public void setOrderId(String v) { orderId = v; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String v) { customerName = v; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String v) { customerEmail = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
    public double getSubtotal() { return subtotal; }
    public void setSubtotal(double v) { subtotal = v; }
    public double getVat() { return vat; }
    public void setVat(double v) { vat = v; }
    public double getTotal() { return total; }
    public void setTotal(double v) { total = v; }
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
    public String getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(String v) { estimatedDelivery = v; }
    public List<LineItem> getItems() { return items; }
    public void setItems(List<LineItem> v) { items = v; }
    public Instant getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(Instant v) { generatedAt = v; }
}
