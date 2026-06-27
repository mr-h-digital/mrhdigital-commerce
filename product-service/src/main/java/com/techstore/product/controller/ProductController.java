package com.techstore.product.controller;

import com.techstore.product.model.FlashSale;
import com.techstore.product.model.Review;
import com.techstore.product.service.FlashSaleService;
import com.techstore.product.service.ProductService;
import com.techstore.product.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final ReviewService reviewService;
    private final FlashSaleService flashSaleService;

    public ProductController(ProductService productService, ReviewService reviewService,
                              FlashSaleService flashSaleService) {
        this.productService = productService;
        this.reviewService  = reviewService;
        this.flashSaleService = flashSaleService;
    }

    // ── Catalog (public) ────────────────────────────────────────────────────

    @GetMapping
    public List<Map<String, Object>> getAllProducts(@RequestParam(required = false) String category) {
        var products = category != null && !category.isBlank()
                ? productService.findByCategory(category) : productService.findAll();
        return products.stream().map(this::enrichWithSale).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProduct(@PathVariable String id) {
        return productService.findById(id)
                .map(p -> ResponseEntity.ok(enrichWithSale(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/featured")
    public List<Map<String, Object>> getFeatured() {
        return productService.findFeatured().stream().map(this::enrichWithSale).toList();
    }

    @GetMapping("/{id}/related")
    public List<Map<String, Object>> getRelated(@PathVariable String id,
                                                 @RequestParam(defaultValue = "3") int limit) {
        return productService.findRelated(id, limit).stream().map(this::enrichWithSale).toList();
    }

    // ── Admin CRUD ───────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<Map<String, Object>> createProduct(@RequestBody ProductService.ProductRequest req) {
        var created = productService.create(req);
        return ResponseEntity.ok(enrichWithSale(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateProduct(@PathVariable String id,
                                                              @RequestBody ProductService.ProductRequest req) {
        return productService.update(id, req)
                .map(p -> ResponseEntity.ok(enrichWithSale(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        return productService.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    // ── Reviews ──────────────────────────────────────────────────────────────

    @GetMapping("/{id}/reviews")
    public List<Review> getReviews(@PathVariable String id) {
        return reviewService.getReviews(id);
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<Review> addReview(@PathVariable String id, @RequestBody ReviewRequest req) {
        if (req.author() == null || req.comment() == null || req.rating() < 1 || req.rating() > 5)
            return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(reviewService.addReview(id, req.author(), req.rating(), req.comment()));
    }

    @DeleteMapping("/{productId}/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable String productId,
                                              @PathVariable String reviewId) {
        return reviewService.deleteReview(reviewId)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    // ── Flash sales ──────────────────────────────────────────────────────────

    @GetMapping("/sales")
    public List<FlashSale> getActiveSales() { return flashSaleService.getActiveSales(); }

    @PostMapping("/sales")
    public ResponseEntity<FlashSale> startSale(@RequestBody SaleRequest req) {
        return ResponseEntity.ok(flashSaleService.startManualSale(
                req.name(), req.discountPercent(), req.productIds(), req.durationSeconds()));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> enrichWithSale(com.techstore.product.model.Product p) {
        var sale = flashSaleService.getSaleForProduct(p.id());
        double salePrice  = sale.map(s -> flashSaleService.getSalePrice(p.id(), p.price())).orElse(p.price());
        double avgRating  = reviewService.getAverageRating(p.id());
        int    reviewCount = reviewService.getReviewCount(p.id());
        double liveRating = reviewCount > 0 ? Math.round(avgRating * 10.0) / 10.0 : p.rating();
        int    liveReviews = reviewCount > 0 ? reviewCount : p.reviewCount();
        return Map.ofEntries(
            Map.entry("id",                   p.id()),
            Map.entry("name",                 p.name()),
            Map.entry("category",             p.category()),
            Map.entry("brand",                p.brand()),
            Map.entry("description",          p.description()),
            Map.entry("price",                p.price()),
            Map.entry("salePrice",            salePrice),
            Map.entry("onSale",               sale.isPresent()),
            Map.entry("discountPercent",      sale.map(FlashSale::getDiscountPercent).orElse(0)),
            Map.entry("saleEndsAt",           sale.map(s -> s.getEndsAt().toString()).orElse("")),
            Map.entry("saleSecondsRemaining", sale.map(FlashSale::getSecondsRemaining).orElse(0L)),
            Map.entry("saleName",             sale.map(FlashSale::getName).orElse("")),
            Map.entry("imageEmoji",           p.imageEmoji()),
            Map.entry("specs",                p.specs()),
            Map.entry("rating",               liveRating),
            Map.entry("reviewCount",          liveReviews),
            Map.entry("featured",             p.featured()),
            Map.entry("badge",                p.badge() != null ? p.badge() : ""),
            Map.entry("tags",                 p.tags())
        );
    }

    public record ReviewRequest(String author, int rating, String comment) {}
    public record SaleRequest(String name, int discountPercent, List<String> productIds, int durationSeconds) {}
}
