package com.capitec.kafkatraining.store;

import com.capitec.kafkatraining.model.ConsumedMessage;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class MessageStore {

    private final CopyOnWriteArrayList<ConsumedMessage> messages = new CopyOnWriteArrayList<>();
    private static final int MAX_MESSAGES = 100;

    public void add(ConsumedMessage message) {
        messages.add(0, message);
        if (messages.size() > MAX_MESSAGES) {
            messages.remove(messages.size() - 1);
        }
    }

    public List<ConsumedMessage> getAll() {
        return Collections.unmodifiableList(new ArrayList<>(messages));
    }

    public void clear() {
        messages.clear();
    }
}
