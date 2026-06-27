package com.techstore.product.service;

import com.techstore.product.model.Product;
import com.techstore.product.model.ProductEntity;
import com.techstore.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository repo;

    public ProductService(ProductRepository repo) {
        this.repo = repo;
    }

    public List<Product> findAll() {
        return repo.findAll().stream().map(ProductEntity::toProduct).toList();
    }

    public Optional<Product> findById(String id) {
        return repo.findById(id).map(ProductEntity::toProduct);
    }

    public List<Product> findByCategory(String category) {
        return repo.findByCategoryIgnoreCase(category).stream()
                .map(ProductEntity::toProduct).toList();
    }

    public List<Product> findFeatured() {
        return repo.findByFeaturedTrue().stream()
                .map(ProductEntity::toProduct).toList();
    }

    public List<Product> findRelated(String productId, int limit) {
        return repo.findById(productId)
                .map(base -> repo.findByCategoryAndIdNot(base.getCategory(), productId)
                        .stream().limit(limit).map(ProductEntity::toProduct).toList())
                .orElse(List.of());
    }

    @Transactional
    public Product create(ProductRequest req) {
        String id = "P" + String.format("%03d", repo.count() + 1);
        // Make sure the ID doesn't clash
        while (repo.existsById(id)) {
            id = "P" + System.currentTimeMillis() % 10000;
        }
        ProductEntity e = buildEntity(id, req);
        return repo.save(e).toProduct();
    }

    @Transactional
    public Optional<Product> update(String id, ProductRequest req) {
        return repo.findById(id).map(e -> {
            applyRequest(e, req);
            return repo.save(e).toProduct();
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (!repo.existsById(id)) return false;
        repo.deleteById(id);
        return true;
    }

    private ProductEntity buildEntity(String id, ProductRequest req) {
        ProductEntity e = new ProductEntity();
        e.setId(id);
        applyRequest(e, req);
        return e;
    }

    private void applyRequest(ProductEntity e, ProductRequest req) {
        if (req.name()        != null) e.setName(req.name());
        if (req.category()    != null) e.setCategory(req.category());
        if (req.brand()       != null) e.setBrand(req.brand());
        if (req.description() != null) e.setDescription(req.description());
        if (req.price()       != null) e.setPrice(req.price());
        if (req.imageEmoji()  != null) e.setImageEmoji(req.imageEmoji());
        if (req.specs()       != null) e.setSpecs(req.specs());
        if (req.badge()       != null) e.setBadge(req.badge().isBlank() ? null : req.badge());
        if (req.featured()    != null) e.setFeatured(req.featured());
        if (req.tags()        != null) e.setTagsJson(String.join(",", req.tags()));
    }

    public record ProductRequest(
        String name, String category, String brand, String description,
        Double price, String imageEmoji, String specs, String badge,
        Boolean featured, List<String> tags
    ) {}
}
