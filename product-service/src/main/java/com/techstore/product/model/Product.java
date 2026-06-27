package com.techstore.product.model;

import java.util.List;

public record Product(
    String id,
    String name,
    String category,
    String brand,
    String description,
    double price,
    String imageEmoji,
    String specs,
    double rating,
    int reviewCount,
    boolean featured,
    String badge,
    List<String> tags
) {
    // Backwards-compatible constructor for existing code
    public Product(String id, String name, String category, String brand,
                   String description, double price, String imageEmoji, String specs) {
        this(id, name, category, brand, description, price, imageEmoji, specs,
             0.0, 0, false, null, List.of());
    }
}
