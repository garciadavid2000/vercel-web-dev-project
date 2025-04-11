// redis.js
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  // password: process.env.REDIS_PASSWORD, // if needed
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.connect();

module.exports = redisClient;
