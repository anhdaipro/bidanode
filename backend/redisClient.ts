import Redis from 'ioredis';

// Tạo một Redis client
const redisClient = new Redis({
  username: 'default',
  password: '7hu8bjxIYVjsZPyxZTYswVMXgwyECo4B',
  host: 'redis-11670.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com',
  port: 11670,
    
});

// Xử lý sự kiện kết nối
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

export default redisClient;