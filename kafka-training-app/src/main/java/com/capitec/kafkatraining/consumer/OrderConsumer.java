package com.capitec.kafkatraining.consumer;

import com.capitec.kafkatraining.model.ConsumedMessage;
import com.capitec.kafkatraining.store.MessageStore;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;

@Service
public class OrderConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderConsumer.class);
    private final MessageStore messageStore;

    public OrderConsumer(MessageStore messageStore) {
        this.messageStore = messageStore;
    }

    @KafkaListener(topics = "${app.kafka.topics.orders}", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(
            ConsumerRecord<String, String> record,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Received order [key={}, partition={}, offset={}]: {}",
                record.key(), partition, offset, record.value());

        messageStore.add(new ConsumedMessage(
                record.key(),
                record.value(),
                partition,
                offset,
                System.currentTimeMillis()
        ));
    }
}
