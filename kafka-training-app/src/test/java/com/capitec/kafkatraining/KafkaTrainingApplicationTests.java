package com.capitec.kafkatraining;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = {"orders", "notifications"})
@ActiveProfiles("test")
class KafkaTrainingApplicationTests {

    @Test
    void contextLoads() {
    }
}
