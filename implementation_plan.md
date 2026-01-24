# 🌊 Implementation Plan: Redis Streams Migration

## Goal
Replace the current Redis List-based queue (`BZPOPMIN`) with **Redis Streams** (`XADD`, `XREADGROUP`) to provide **At-Least-Once delivery**, Consumer Groups, and crash recovery.

## 📦 Components to Modify

### 1. `src/queue/traits.rs`
- **Update `Job` struct**: Ensure it's compatible with Stream payloads (already JSON, so fine).
- **Update `QueueBackend` trait**:
    - `dequeue` needs to potentially return a `StreamId` for tracking.
    - NEW method: `ack_job(job_id: Uuid, stream_id: String)`.

### 2. `src/queue/redis_stream.rs` (NEW)
Create a new backend implementation `RedisStreamBackend` to exist alongside the old one during migration.

**Key Methods:**
- `new()`: Initialize consumer group (`XGROUP CREATE`).
- `enqueue()`: Use `XADD` to append job to stream `ironforge:stream:jobs`.
- `dequeue()`: Use `XREADGROUP` to read pending messages for consumer.
- `ack()`: Use `XACK` to confirm processing.
- `recover()`: Use `XAUTOCLAIM` to pick up jobs from crashed consumers.

### 3. `src/models/mod.rs`
- Add `stream_id` field to `Job` (optional) to track the Redis Stream ID needed for ACK.

## 📝 Step-by-Step Implementation

1.  **[SCAFFOLD]** Create `src/queue/streams.rs` with the `RedisStreamBackend` struct.
2.  **[IMPL]** Implement `enqueue` (XADD).
3.  **[IMPL]** Implement `dequeue` (XREADGROUP).
4.  **[IMPL]** Implement `ack` functionality.
5.  **[TEST]** Create integration test `tests/stream_integration.rs` to verify:
    - Enqueue works.
    - Dequeue gets the job.
    - ACK removes it from Pending List (PEL).
6.  **[SWITCH]** Update `main.rs` / `lib.rs` to use `RedisStreamBackend` by default.

## ⚠️ Breaking Changes
- The underlying Redis data structure changes from `ZSET` (priority queue) to `STREAM`.
- **Note on Priority**: Redis Streams are FIFO. To support Priority with Streams, we might need **multiple streams** (e.g., `queue:high`, `queue:default`, `queue:low`) and have the consumer poll them in order.
    - *Decision*: For MVP, we will stick to a single stream or basic priority support via multiple reads.
    - *Refined Decision*: We will implement **3 Streams** (`high`, `normal`, `low`) to maintain the priority feature we had with `ZSET`.
