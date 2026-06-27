package com.techstore.notification.store;

import com.techstore.notification.model.StoreEvent;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class EventStore {

    private final CopyOnWriteArrayList<StoreEvent> events = new CopyOnWriteArrayList<>();
    private static final int MAX = 200;

    public void add(String topic, String eventType, String orderId,
                    String summary, String detail, String status) {
        String id = UUID.randomUUID().toString().substring(0, 8);
        events.add(0, new StoreEvent(id, topic, eventType, orderId, summary, detail, status));
        if (events.size() > MAX) events.remove(events.size() - 1);
    }

    public List<StoreEvent> getAll() {
        return Collections.unmodifiableList(new ArrayList<>(events));
    }

    public void clear() { events.clear(); }
}
