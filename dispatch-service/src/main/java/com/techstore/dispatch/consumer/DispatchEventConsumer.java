package com.techstore.dispatch.consumer;

import com.techstore.dispatch.event.PaymentCompletedEvent;
import com.techstore.dispatch.service.DispatchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class DispatchEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(DispatchEventConsumer.class);
    private final DispatchService dispatchService;

    public DispatchEventConsumer(DispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    @KafkaListener(topics = "${app.kafka.topics.payment-completed}", groupId = "${spring.kafka.consumer.group-id}")
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        log.info("Dispatch received PaymentCompleted for {} — assigning courier", event.getOrderId());
        dispatchService.dispatch(event);
    }
}
