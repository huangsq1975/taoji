-- customer_notification_reads: tracks which follow_up_records the customer has read
-- Notifications are derived from follow_up_records; read state is persisted here.
CREATE TABLE customer_notification_reads (
    id            BIGSERIAL PRIMARY KEY,
    customer_id   BIGINT NOT NULL,
    source_id     BIGINT NOT NULL,       -- follow_up_records.id
    read_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (customer_id, source_id)
);
