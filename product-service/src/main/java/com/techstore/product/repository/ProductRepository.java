package com.techstore.product.repository;

import com.techstore.product.model.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<ProductEntity, String> {
    List<ProductEntity> findByCategoryIgnoreCase(String category);
    List<ProductEntity> findByFeaturedTrue();
    List<ProductEntity> findByCategoryAndIdNot(String category, String id);
}
