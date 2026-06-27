package com.techstore.inventory.model;

import jakarta.persistence.*;

@Entity
@Table(name = "stock")
public class StockItem {

    @Id
    private String productId;
    private int quantity;

    public StockItem() {}

    public StockItem(String productId, int quantity) {
        this.productId = productId;
        this.quantity = quantity;
    }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}
