package com.techstore.product.service;

import com.techstore.product.model.Review;
import com.techstore.product.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ReviewService {

    private final ReviewRepository repo;

    public ReviewService(ReviewRepository repo) {
        this.repo = repo;
    }

    public List<Review> getReviews(String productId) {
        return repo.findByProductIdOrderByCreatedAtDesc(productId);
    }

    @Transactional
    public Review addReview(String productId, String author, int rating, String comment) {
        Review review = new Review(
                UUID.randomUUID().toString().substring(0, 8),
                productId, author,
                Math.max(1, Math.min(5, rating)),
                comment);
        return repo.save(review);
    }

    public double getAverageRating(String productId) {
        Double avg = repo.averageRatingByProductId(productId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0;
    }

    public int getReviewCount(String productId) {
        return repo.countByProductId(productId);
    }

    @Transactional
    public boolean deleteReview(String reviewId) {
        if (!repo.existsById(reviewId)) return false;
        repo.deleteById(reviewId);
        return true;
    }
}
