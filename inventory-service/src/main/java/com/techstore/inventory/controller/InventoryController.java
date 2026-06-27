package com.techstore.inventory.controller;

import com.techstore.inventory.model.StockItem;
import com.techstore.inventory.repository.StockRepository;
import com.techstore.inventory.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    private final InventoryService inventoryService;
    private final StockRepository stockRepository;

    public InventoryController(InventoryService inventoryService, StockRepository stockRepository) {
        this.inventoryService = inventoryService;
        this.stockRepository = stockRepository;
    }

    @GetMapping("/stock")
    public Map<String, Integer> getStock() {
        return inventoryService.getStock();
    }

    @PutMapping("/stock/{productId}")
    public ResponseEntity<StockItem> setStock(@PathVariable String productId,
                                               @RequestParam int quantity) {
        StockItem item = stockRepository.findById(productId)
                .orElse(new StockItem(productId, 0));
        item.setQuantity(quantity);
        return ResponseEntity.ok(stockRepository.save(item));
    }
}
