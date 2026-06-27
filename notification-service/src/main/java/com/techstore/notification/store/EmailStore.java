package com.techstore.notification.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.techstore.notification.model.OrderEmail;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class EmailStore {

    private final Map<String, OrderEmail> emails = new ConcurrentHashMap<>();

    public void upsert(String orderId, JsonNode payload, String status) {
        OrderEmail email = emails.computeIfAbsent(orderId, id -> {
            OrderEmail e = new OrderEmail();
            e.setOrderId(id);
            return e;
        });
        email.setStatus(status);

        if (payload.has("customerName"))    email.setCustomerName(payload.path("customerName").asText());
        if (payload.has("customerEmail"))   email.setCustomerEmail(payload.path("customerEmail").asText());
        if (payload.has("subtotalAmount"))  email.setSubtotal(payload.path("subtotalAmount").asDouble());
        if (payload.has("vatAmount"))       email.setVat(payload.path("vatAmount").asDouble());
        if (payload.has("totalAmount"))     email.setTotal(payload.path("totalAmount").asDouble());
        if (payload.has("street"))          email.setStreet(payload.path("street").asText());
        if (payload.has("suburb"))          email.setSuburb(payload.path("suburb").asText());
        if (payload.has("city"))            email.setCity(payload.path("city").asText());
        if (payload.has("postalCode"))      email.setPostalCode(payload.path("postalCode").asText());
        if (payload.has("province"))        email.setProvince(payload.path("province").asText());
        if (payload.has("estimatedDelivery")) email.setEstimatedDelivery(payload.path("estimatedDelivery").asText());

        if (payload.has("items")) {
            List<OrderEmail.LineItem> items = new ArrayList<>();
            for (JsonNode item : payload.path("items")) {
                String name     = item.path("productName").asText();
                int qty         = item.path("quantity").asInt(1);
                double unit     = item.path("unitPrice").asDouble();
                items.add(new OrderEmail.LineItem(name, qty, unit, unit * qty));
            }
            if (!items.isEmpty()) email.setItems(items);
        }
    }

    public Optional<OrderEmail> get(String orderId) {
        return Optional.ofNullable(emails.get(orderId));
    }

    public Collection<OrderEmail> getAll() { return emails.values(); }
}
