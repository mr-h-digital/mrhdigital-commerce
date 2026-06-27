package com.techstore.product.service;

import com.techstore.product.model.FlashSale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FlashSaleService {

    private static final Logger log = LoggerFactory.getLogger(FlashSaleService.class);
    private final Map<String, FlashSale> sales = new ConcurrentHashMap<>();

    // Rotate flash sales automatically every 3 minutes
    private static final List<FlashSaleTemplate> TEMPLATES = List.of(
        new FlashSaleTemplate("Audio Blowout 🎧", 20, List.of("P009", "P010"), 120),
        new FlashSaleTemplate("Laptop Flash 💻", 15, List.of("P001", "P002", "P003"), 90),
        new FlashSaleTemplate("Mobile Madness 📱", 10, List.of("P004", "P005", "P006"), 100),
        new FlashSaleTemplate("Tech Essentials ⚡", 25, List.of("P011", "P012"), 80)
    );

    private int templateIndex = 0;

    @Scheduled(fixedDelay = 180000) // every 3 minutes
    public void rotateSale() {
        // Expire old sales
        sales.values().removeIf(s -> Instant.now().isAfter(s.getEndsAt()));

        // Start new sale
        FlashSaleTemplate t = TEMPLATES.get(templateIndex % TEMPLATES.size());
        templateIndex++;
        String id = "SALE-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        FlashSale sale = new FlashSale(id, t.name(), t.discount(), t.productIds(), t.durationSeconds());
        sales.put(id, sale);
        log.info("Flash sale started: {} — {}% off {}", t.name(), t.discount(), t.productIds());
    }

    public List<FlashSale> getActiveSales() {
        sales.values().removeIf(s -> Instant.now().isAfter(s.getEndsAt()));
        return List.copyOf(sales.values());
    }

    public Optional<FlashSale> getSaleForProduct(String productId) {
        return sales.values().stream()
                .filter(s -> s.isActive() && Instant.now().isBefore(s.getEndsAt()))
                .filter(s -> s.getProductIds().contains(productId))
                .findFirst();
    }

    public double getSalePrice(String productId, double originalPrice) {
        return getSaleForProduct(productId)
                .map(s -> Math.round(originalPrice * (1 - s.getDiscountPercent() / 100.0) * 100.0) / 100.0)
                .orElse(originalPrice);
    }

    public FlashSale startManualSale(String name, int discountPercent, List<String> productIds, int durationSeconds) {
        String id = "SALE-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        FlashSale sale = new FlashSale(id, name, discountPercent, productIds, durationSeconds);
        sales.put(id, sale);
        log.info("Manual flash sale started: {}", name);
        return sale;
    }

    record FlashSaleTemplate(String name, int discount, List<String> productIds, int durationSeconds) {}
}
