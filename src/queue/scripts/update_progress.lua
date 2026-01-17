-- Atomic Update Job Progress
-- KEYS[1]: job_key
-- ARGV[1]: progress (number)

local job_json = redis.call('GET', KEYS[1])
if not job_json then
    return redis.error_reply("Job not found")
end

local job = cjson.decode(job_json)
job.progress = tonumber(ARGV[1])

local new_json = cjson.encode(job)
redis.call('SET', KEYS[1], new_json)

return 0
