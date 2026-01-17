-- Atomic Move to DLQ
-- KEYS[1]: job_key (e.g., "jobs:uuid")
-- KEYS[2]: dlq_key (e.g., "queue:dlq")
-- ARGV[1]: job_json_string
-- ARGV[2]: job_id_string

redis.call('SET', KEYS[1], ARGV[1])
redis.call('LPUSH', KEYS[2], ARGV[2])

return 0
