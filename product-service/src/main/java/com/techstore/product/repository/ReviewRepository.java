package com.techstore.product.repository;

import com.techstore.product.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByProductIdOrderByCreatedAtDesc(String productId);
    int countByProductId(String productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productId = :productId")
    Double averageRatingByProductId(String productId);
}
