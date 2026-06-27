package com.techstore.order.repository;

import com.techstore.order.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, String> {

    /** All orders for a specific user, newest first */
    List<Order> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    Optional<Order> findByOrderIdAndCustomerId(String orderId, String customerId);
}
