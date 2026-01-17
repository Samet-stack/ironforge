-- Atomic Delete Job
-- KEYS[1]: job_key
-- KEYS[2]: queue_key
-- KEYS[3]: active_jobs_key
-- ARGV[1]: job_id_string

redis.call('DEL', KEYS[1])
redis.call('ZREM', KEYS[2], ARGV[1])
redis.call('SREM', KEYS[3], ARGV[1])

return 0
