-- Atomic Enqueue
-- KEYS[1]: job_key (e.g., "jobs:uuid")
-- KEYS[2]: queue_key (e.g., "queue:main")
-- ARGV[1]: job_json_string
-- ARGV[2]: job_id_string
-- ARGV[3]: priority_score

redis.call('SET', KEYS[1], ARGV[1])
redis.call('ZADD', KEYS[2], ARGV[3], ARGV[2])

return 0
