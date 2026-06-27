package com.techstore.product.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    private String id;
    private String productId;
    private String author;
    private int rating;

    @Column(length = 2000)
    private String comment;

    private Instant createdAt;

    public Review() {}

    public Review(String id, String productId, String author, int rating, String comment) {
        this.id = id; this.productId = productId; this.author = author;
        this.rating = rating; this.comment = comment; this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String v) { id = v; }
    public String getProductId() { return productId; }
    public void setProductId(String v) { productId = v; }
    public String getAuthor() { return author; }
    public void setAuthor(String v) { author = v; }
    public int getRating() { return rating; }
    public void setRating(int v) { rating = v; }
    public String getComment() { return comment; }
    public void setComment(String v) { comment = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { createdAt = v; }
}
