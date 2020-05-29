import redis from 'redis';
import config from '../env.config';

const client = redis.createClient(config.redis.port, config.redis.host);

client.on('connect', () => {
  console.log('Redis client connected', config.redis.host); // eslint-disable-line no-console
});

export default client;
