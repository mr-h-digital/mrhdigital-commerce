package com.techstore.product.model;

import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class ProductEntity {

    @Id
    private String id;
    private String name;
    private String category;
    private String brand;

    @Column(length = 2000)
    private String description;

    private double price;
    private String imageEmoji;
    private String specs;
    private double rating;
    private int reviewCount;
    private boolean featured;
    private String badge;

    @Column(length = 500)
    private String tagsJson; // stored as comma-separated string

    public ProductEntity() {}

    public String getId() { return id; }
    public void setId(String v) { id = v; }
    public String getName() { return name; }
    public void setName(String v) { name = v; }
    public String getCategory() { return category; }
    public void setCategory(String v) { category = v; }
    public String getBrand() { return brand; }
    public void setBrand(String v) { brand = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { description = v; }
    public double getPrice() { return price; }
    public void setPrice(double v) { price = v; }
    public String getImageEmoji() { return imageEmoji; }
    public void setImageEmoji(String v) { imageEmoji = v; }
    public String getSpecs() { return specs; }
    public void setSpecs(String v) { specs = v; }
    public double getRating() { return rating; }
    public void setRating(double v) { rating = v; }
    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int v) { reviewCount = v; }
    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean v) { featured = v; }
    public String getBadge() { return badge; }
    public void setBadge(String v) { badge = v; }
    public String getTagsJson() { return tagsJson; }
    public void setTagsJson(String v) { tagsJson = v; }

    /** Convert to the API-facing Product record */
    public Product toProduct() {
        java.util.List<String> tags = (tagsJson != null && !tagsJson.isBlank())
            ? java.util.Arrays.asList(tagsJson.split(","))
            : java.util.List.of();
        return new Product(id, name, category, brand, description, price,
                imageEmoji, specs, rating, reviewCount, featured, badge, tags);
    }

    /** Create entity from the API-facing Product record */
    public static ProductEntity from(Product p) {
        ProductEntity e = new ProductEntity();
        e.id          = p.id();
        e.name        = p.name();
        e.category    = p.category();
        e.brand       = p.brand();
        e.description = p.description();
        e.price       = p.price();
        e.imageEmoji  = p.imageEmoji();
        e.specs       = p.specs();
        e.rating      = p.rating();
        e.reviewCount = p.reviewCount();
        e.featured    = p.featured();
        e.badge       = p.badge();
        e.tagsJson    = p.tags() != null ? String.join(",", p.tags()) : "";
        return e;
    }
}
