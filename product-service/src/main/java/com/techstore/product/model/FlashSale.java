package com.techstore.product.model;

import java.time.Instant;
import java.util.List;

public class FlashSale {
    private String id;
    private String name;
    private int discountPercent;
    private List<String> productIds;
    private Instant startsAt;
    private Instant endsAt;
    private boolean active;

    public FlashSale() {}
    public FlashSale(String id, String name, int discountPercent, List<String> productIds, int durationSeconds) {
        this.id = id; this.name = name; this.discountPercent = discountPercent;
        this.productIds = productIds;
        this.startsAt = Instant.now();
        this.endsAt = startsAt.plusSeconds(durationSeconds);
        this.active = true;
    }

    public String getId() { return id; }
    public void setId(String v) { id = v; }
    public String getName() { return name; }
    public void setName(String v) { name = v; }
    public int getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(int v) { discountPercent = v; }
    public List<String> getProductIds() { return productIds; }
    public void setProductIds(List<String> v) { productIds = v; }
    public Instant getStartsAt() { return startsAt; }
    public void setStartsAt(Instant v) { startsAt = v; }
    public Instant getEndsAt() { return endsAt; }
    public void setEndsAt(Instant v) { endsAt = v; }
    public boolean isActive() { return active; }
    public void setActive(boolean v) { active = v; }
    public long getSecondsRemaining() {
        long rem = endsAt.getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, rem);
    }
}
