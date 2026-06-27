package com.techstore.inventory.event;

import java.util.List;

public class InventoryReleasedEvent {
    private String orderId;
    private List<OrderItem> items;

    public InventoryReleasedEvent() {}

    public String getOrderId() { return orderId; }
    public void setOrderId(String v) { this.orderId = v; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> v) { this.items = v; }

    public static class OrderItem {
        private String productId;
        private String productName;
        private int quantity;
        private double unitPrice;

        public OrderItem() {}
        public String getProductId() { return productId; }
        public void setProductId(String v) { this.productId = v; }
        public String getProductName() { return productName; }
        public void setProductName(String v) { this.productName = v; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int v) { this.quantity = v; }
        public double getUnitPrice() { return unitPrice; }
        public void setUnitPrice(double v) { this.unitPrice = v; }
    }
}
