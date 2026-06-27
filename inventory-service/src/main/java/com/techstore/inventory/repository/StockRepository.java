package com.techstore.inventory.repository;

import com.techstore.inventory.model.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface StockRepository extends JpaRepository<StockItem, String> {

    @Modifying
    @Query("UPDATE StockItem s SET s.quantity = s.quantity - :qty WHERE s.productId = :productId AND s.quantity >= :qty")
    int decrementStock(String productId, int qty);
}
